// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const moment = require('moment');
const { getCurrentWindow, globalShortcut } = require('electron').remote;
const constants = require('./js/util/constants');
const api = require('./js/api/plaid-api');
const StoreCreator = require('./js/util/Store');
const DrawerCreator = require('./js/util/drawers');

const Store = new StoreCreator();
const drawer = new DrawerCreator();

const pages = {
  overview: 'Overview',
  accounts: 'Accounts',
  credit: 'Credit Cards',
  investments: 'Investments',
  banks: 'Banks',
  crypto: 'Cryptocurrency',
  transactions: 'Transactions'
};

const titles = {
  Overview: 'overview',
  Accounts: 'accounts',
  'Credit Cards': 'credit',
  Investments: 'investments',
  Banks: 'banks',
  Cryptocurrency: 'crypto',
  Transactions: 'transactions'
};

api.init();

const pageInit = () => {
  showLoader();
  $('#messageModal').modal({ show: false });
  const initialFetchData = () => {
    return new Promise((resolve, reject) => {
      api.getAllInstitutionData()
        .then(institutions => {
          if(!institutions.length) {
            resolve({
              error: false,
              accountDataExists: false
            });
          }
          const accountPromises = [];
          const transactionPromises = [];
          institutions.forEach(institution => {
            accountPromises.push(api.fetchAccountData(institution.item_token));
            transactionPromises.push(api.fetchTransactionData(institution.item_token));
          });
          Promise.all(accountPromises)
            .then(result => {
              api.fetchCrypto()
                 .then(crypto => {
                    setupCryptoSuggestions(crypto);
                    api.getCryptoHoldings().then(cryptoAccounts => {
                      const cryptoAccountData = cryptoAccounts.map(cryptoAccount => {
                        const data = crypto[cryptoAccount.crypto_id];
                        data.holdings = cryptoAccount.holdings;
                        return createAccountObject(data);
                      });
                      Store.addAccountCollection([...result, ...cryptoAccountData]);
                      resolve({
                        error: false,
                        accountDataExists: true
                      });
                    });
                 })
                 .catch(err => {
                    reject({
                      error: true,
                      errorType: 'CRYPTO'
                    });
                 });
            })
            .catch(err => {
              reject({
                error: true,
                errorType: 'ACCOUNT'
              });
            });
          
          Promise.all(transactionPromises)
                 .then(result => {
                   Store.addAllTransactions(result);
                   drawTransactions();
                 });
        })
        .catch(err => {
          reject({
            error: true,
            errorType: 'INSTITUTION'
          });
        });
    });
  };

  initialFetchData()
    .then(readyState => {
      if(readyState.accountDataExists) {
        drawAll();
      }
      else {
        drawNone();
      }
    })
    .catch(errorState => {
      drawError();
    });
};

const handler = Plaid.create({
  apiVersion: 'v2',
  clientName: 'Marshmallowsocks Finance',
  env: constants.plaid.PLAID_ENV,
  product: ['transactions'],
  key: constants.plaid.PLAID_PUBLIC_KEY,
  onSuccess: async function(public_token) {
    const result = await api.exchangePublicToken(public_token);
    if(!result.error) {
      const { name, itemId, products } = await api.fetchLatestInstitutionData();
      const accountData = await api.fetchAccountData(itemId);
      Store.addAccount(accountData);
      drawAll();
    }
  },
  onExit: function(err, metadata) {
    console.log('Plaid Link exit!');
    console.log(err);
    hideLoader();
  }
});

$('#link-btn').on('click', e => {
  showLoader();
  handler.open();
});

$('#databaseExport').on('click', e => {
  api.exportDatabase().then(res => {
    if(!res.error) {
      $('#modalMessage').html('Successfully exported database to <code>exportedDB.json</code>');
      $('#messageModal').modal('show');
    }
  });
});

$('#importDatabase').on('change', e => {
  if(e.target.files.length === 0) {
    $('#modalMessage').html('No file selected.');
    $('#messageModal').modal('show');
  }
  else {
    const reader = new FileReader();
    reader.readAsText(e.target.files[0]);
    reader.onload = event => {
      const jsonString = event.target.result;
      api.importDatabase(jsonString).then(res => {
        if(!res.error) {
          $('#modalMessage').html('Successfully imported database!<br>Page will reload in 5 seconds.');
          $('#messageModal').modal('show');
          setTimeout(() => {
            getCurrentWindow().reload();            
          }, 5000);
        }
        else {
          $('#modalMessage').html('Could not import database.')
          $('#messageModal').modal('show');
        }
      });
    }
    reader.onerror = event => {
      $('#modalMessage').html('Could not read file.');
      $('#messageModal').modal('show');
    }
    
  }
});

$('#cryptoSubmit').on('click', e => {
  const symbol = $('#addCryptoField').val();
  const holdings = $('#addHoldingField').val();
  if(isNaN(parseInt(holdings, 10))) {
    holdings = 0;
  }
  const crypto = Store.getCryptoInformation(symbol);
  api.saveCryptoHolding({
    crypto_id: crypto.id,
    name: crypto.name,
    symbol,
    holdings,
  }).then(res => {
    if(!res.exists) {
      Store.addAccount(createAccountObject(crypto, holdings));
    }
    drawAll();
  });
});

$('ul.nav.flex-column li > a').each(function() {
  $(this).on('click', () => {
    let current = $(this).attr('data-goto');

    $('ul.nav.flex-column li > a').removeClass('active');
    $(this).addClass('active');

    $('#app > div').addClass('d-none');
    $(`#${current}`).removeClass('d-none');

    $('#title').html(pages[current]);

    switch(current) {
      case 'overview':
        drawContextBalance(Store.netBalance);
        break;
      case 'accounts':
        drawContextBalance(Store.cashBalance);
        break;
      case 'credit':
        drawContextBalance(-Store.creditDebt);
        break;
      case 'investments':
        drawContextBalance(Store.investmentBalance);
        break;
      case 'crypto':
        drawContextBalance(Store.cryptoBalance);
        break;
      default:
        drawContextBalance('-');
        break;
    }
  });
});

const createAccountObject = (crypto, holdings) => {
  const storeObject = {};
  storeObject.crypto = [];
  storeObject.crypto.push({
    account_id: '-',
    balances: {
      available: (crypto.holdings || holdings) * crypto.quotes.USD.price
    },
    institutionName: crypto.symbol,
    mask: `Holdings: ${crypto.holdings || holdings} ${crypto.symbol}`, // use the mask field to show holdings in card
    official_name: `Price as of ${moment.unix(crypto.last_updated).format()} : $${crypto.quotes.USD.price}`, // use the official_name field to show current price.
    name: crypto.name,
    subtype: 'crypto',
    type: 'crypto'
  });

  return storeObject;
}
const showLoader = () => {
  $('#app > div').addClass('d-none');
  $('#loading').removeClass('d-none');
}

const hideLoader = () => {
  $('#app > div').addClass('d-none');
  $('#' + titles[$('#title').text()]).removeClass('d-none');
}

const drawAll = () => {
  $('#overview').html(drawer.drawOverview(Store));
  $('#accounts').html(drawer.drawAccountCards(Store));
  $('#credit').html(drawer.drawCreditCards(Store));
  $('#investments').html(drawer.drawInvestmentCards(Store));
  $('#banks').html(drawer.drawBankCards(Store));
  $('#crypto').html(drawer.drawCryptoCards(Store));
  drawNetBalance(Store.netBalance);
  drawContextBalance(Store.netBalance);
  hideLoader();
}

const drawTransactions = () => {
  $('#transactions').html(drawer.drawTransactions(Store));
  feather.replace();
}

const drawNone = () => {
  Object.keys(pages).forEach(page => {
    $(`#${page}`).html(drawer.drawNoneCard());
  });

  drawNetBalance('-');
  hideLoader();
}

const drawError = () => {
  //TODO: finish this function
  // $('#overview').html();
  // $('#accounts').html(drawer.drawAccountCards(Store));
  // $('#credit').html(drawer.drawCreditCards(Store));
  // $('#investments').html(drawer.drawInvestmentCards(Store));

  // $('#netBalance').html(Store.netBalance);
  hideLoader();
}

const drawNetBalance = (balance) => {
  //also replace all feather icons.
  feather.replace();

  const netBalanceMarkup = drawer.drawNetBalance(balance);
  $('#netBalance').addClass(netBalanceMarkup.classStyle);
  $('#netBalance').html(netBalanceMarkup.balance);
}

const drawContextBalance = (balance) => {
  $('#contextBalance').removeClass();
  const contextBalanceMarkup = drawer.drawNetBalance(balance);
  $('#contextBalance').addClass(contextBalanceMarkup.classStyle);
  $('#contextBalance').html(contextBalanceMarkup.balance);
}

const setupCryptoSuggestions = (crypto) => {
  const source = [];
  let suggestions;
  Object.keys(crypto).forEach(key => {
    source.push(crypto[key]);
  });
  Store.addAllCrypto(source);
  
  suggestions = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: source.map(s => s.symbol)
  });

  $('#addCryptoField').typeahead({
    hint: true,
    highlight: true,
    minLength: 1,
  },
  {
    name: 'crypto',
    source: suggestions
  });

  $('#addCryptoField').bind('typeahead:selected', (obj, data, name) => {
    if(Store.getCryptoInformation(data)) {
      $('#cryptoSubmit').prop('disabled', false);
    }
    else {
      $('#cryptoSubmit').prop('disabled', true);
    }
  });
}

// starting point
pageInit();
