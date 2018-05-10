// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

//const moment = require('moment');
const { getCurrentWindow, globalShortcut } = require('electron').remote;
const Chart  = require('chart.js');

const constants = require('./js/util/constants');
const api = require('./js/api/plaid-api');
const helpers = require('./js/util/helpers');

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
  transactions: 'Transactions',
  calendar: 'Calendar',
  groups: 'Groups',
  chart: 'Transaction Breakdown',
};

const titles = {
  Overview: 'overview',
  Accounts: 'accounts',
  'Credit Cards': 'credit',
  Investments: 'investments',
  Banks: 'banks',
  Cryptocurrency: 'crypto',
  Transactions: 'transactions',
  Calendar: 'calendar',
  Groups: 'groups',
  'Transaction Breakdown': 'chart',
};

let transactionBreakdown;
let colors = [
  'rgba(255,99,132,1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)'
];

const activeDateRanges = {
  thisWeek: true,
  thisMonth: false,
  lastMonth: false,
  thisYear: false,
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
            api.fetchCrypto()
                 .then(crypto => {
                    setupCryptoSuggestions(crypto);
                    api.getCryptoHoldings().then(cryptoAccounts => {
                      if(cryptoAccounts.length === 0) {
                        resolve({
                          error: false,
                          accountDataExists: false
                        });
                      }
                      const cryptoAccountData = cryptoAccounts.map(cryptoAccount => {
                        const data = crypto[cryptoAccount.crypto_id];
                        data.holdings = cryptoAccount.holdings;
                        return createAccountObject(data);
                      });
                      Store.addAccountCollection(cryptoAccountData);
                      resolve({
                        error: false,
                        accountDataExists: true
                      });
                    });
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
                      api.getGroups().then(groups => {
                        Store.addAccountCollection([...result, ...cryptoAccountData]);
                        Store.addGroupCollection(groups);
                        resolve({
                          error: false,
                          accountDataExists: true
                        });
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
                   drawCalendarTransactions();
                   drawTransactionBreakdown('thisWeek');
                   attachChartHandlers();
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

$('#createGroupButton').on('click', e => {
  $('#createGroupModal').modal({ show: false });
  let markup = '';
  Store.allAccounts.forEach(account => {
    markup += `<tr>
                <td>${account.name}</td>
                <td>${account.institutionName}</td>
                <td>
                <div class="form-check">
                  <input class="form-check-input" name="createGroupCheckbox" type="checkbox" value="${account.account_id}" id="${account.account_id}">
                </div>
                </td>
               </tr>`
  });
  $('#createGroupTableBody').html(markup);
  $('#createGroupModal').modal('show');

});

$('#createGroupSubmit').on('click', e => {
  const accounts = $('input:checkbox:checked').map(function() {
    return this.value;
  }).get();
  const name = $('#createGroupField').val();
  if(name === '' || name === null || name === undefined) {
    name = 'Default group';
  }
  api.createGroup(name, accounts).then(res => {
    console.log('Created group');
    getCurrentWindow().reload();
  });
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
      available: (crypto.holdings || holdings) * crypto.quotes.USD.price,
      current: null,
      limit: null,
    },
    institutionName: crypto.symbol,
    mask: `Holdings: ${crypto.holdings || holdings} ${crypto.symbol}`, // use the mask field to show holdings in card
    official_name: `Price as of ${moment.unix(crypto.last_updated).format('MMM Do YYYY HH:mm:ss')} : <span class="font-weight-bold">$${crypto.quotes.USD.price}</span>`, // use the official_name field to show current price.
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
  $('#groups').html(drawer.drawGroups(Store));
  attachGroupHandlers();
  drawNetBalance(Store.netBalance);
  drawContextBalance(Store.netBalance);
  hideLoader();
}

const attachGroupHandlers = () => {
  Store.groups.forEach(group => {
    $(`#group${group.id}`).on('click', function(e) {
      api.deleteGroup(group.id).then(res => {
        getCurrentWindow().reload();
      });
    });
  });
}

const attachChartHandlers = () => {
  $('#chartTransactionThisWeek').on('click', function(e) {
    activeDateRanges.thisWeek = !activeDateRanges.thisWeek;
    $('#chartTransactionButtonBar > button.btn-primary').removeClass('btn-primary').addClass('btn-secondary');
    $(this).addClass('btn-primary').removeClass('btn-secondary');
    drawTransactionBreakdown('thisWeek');
  });

  $('#chartTransactionThisMonth').on('click', function(e) {
    activeDateRanges.thisMonth = !activeDateRanges.thisMonth;
    $('#chartTransactionButtonBar > button.btn-primary').removeClass('btn-primary').addClass('btn-secondary');
    $(this).addClass('btn-primary').removeClass('btn-secondary');
    drawTransactionBreakdown('thisMonth');
  });

  $('#chartTransactionLastMonth').on('click', function(e) {
    activeDateRanges.lastMonth = !activeDateRanges.lastMonth;
    $('#chartTransactionButtonBar > button.btn-primary').removeClass('btn-primary').addClass('btn-secondary');
    $(this).addClass('btn-primary').removeClass('btn-secondary');
    drawTransactionBreakdown('lastMonth');
  });

  $('#chartTransactionThisYear').on('click', function(e) {
    activeDateRanges.thisYear = !activeDateRanges.thisYear;
    $('#chartTransactionButtonBar > button.btn-primary').removeClass('btn-primary').addClass('btn-secondary');
    $(this).addClass('btn-primary').removeClass('btn-secondary');
    drawTransactionBreakdown('thisYear');
  });
}

const drawTransactions = () => {
  $('#transactions').html(drawer.drawTransactions(Store));
  initializeDataTable('transactionsTable', 'transactions');
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

const drawCalendarTransactions = () => {
  $('#calendarContainer').fullCalendar({
    defaultView: 'month',
    dayRender: (date, cell) => {
      if(date.isAfter(moment().format('YYYY-MM-DD'))) {
        return;
      }
      const transactionData = Store.getTransactionsSummaryForDate(date.format());
      $(cell).html(drawer.drawTransactionForDate(transactionData));
    },
    dayClick: (date, jsEvent, view) => {
      const transactionData = Store.getTransactionsForDate(date.format());
      $('#transactionsByDate').html(
        `<h3>Charges on ${date.format('MMMM Do YYYY')}</h3>${drawer.drawTransactionsByCategory(transactionData)}`
      );
    }
  });
}

const isInDateRange = (date, dateRange) => {
  switch(dateRange) {
    case 'thisWeek':
      return moment(date).isSame(moment(), 'week');
    case 'thisMonth':
      return moment(date).isSame(moment(), 'month');
    case 'lastMonth':
      return moment(date).isSame(moment().subtract(1, 'month'), 'month');
    case 'thisYear':
      return true; // all transactions are for the year
  }
}

const drawTransactionBreakdown = (dateRange) => {
  const ctx = document.getElementById("chartCanvas").getContext('2d');
  const transactionDataset = [];
  const transactionDataLabels = [];
  const groupedTransactions = helpers.groupBy(Store.allTransactions, 'mainCategory');
  let data;
  let options = {
    onClick: (e, data) => {
      const key = data[0]._model.label === 'Uncategorized' ? 'undefined' : data[0]._model.label;
      
      $('#chartTransactions').html(
        drawer.drawTransactionsByCategory(
          groupedTransactions[key].filter(transaction => {
            return isInDateRange(transaction.date, dateRange)  
          })
        )
      );

      initializeDataTable('transactionsCategoryTable', 'categories');
    }
  };
  
  Object.keys(groupedTransactions)
        .forEach(key => {
          let total = 0;
          if(key === 'undefined') {
            transactionDataLabels.push('Uncategorized');  
          }
          else {
            transactionDataLabels.push(key);
          }
          groupedTransactions[key].forEach(transaction => {
            if(isInDateRange(transaction.date, dateRange)) {
              total += transaction.amount;
            }
          });

          transactionDataset.push(Math.abs(total));
        });

  while(colors.length < transactionDataLabels.length) {
    colors = [...colors, ...colors];
  }
  while(colors.length !== transactionDataLabels.length) {
    colors.pop();
  }

  data = {
    datasets: [{
      data: transactionDataset,
      backgroundColor: colors,
    }],
    labels: transactionDataLabels
  };

  if(!transactionBreakdown) {
    transactionBreakdown = new Chart(ctx, {
      type: 'doughnut',
      data,
      options,
    });
  }
  else {
    setTimeout(() => {
      transactionBreakdown.options = options;
      transactionBreakdown.data = data;
      transactionBreakdown.data.labels = transactionDataLabels;
      transactionBreakdown.update();
    }, 0);
  }
}

const initializeDataTable = (id, type) => {
  if($.fn.dataTable.isDataTable(`#${id}`)) {
    return;
  }
  $(`#${id}`).DataTable({
    'footerCallback': function (row, data, start, end, display) {
        var api = this.api(), data;
        const columnIndex = type === 'transactions' ? 2 : 1;
        // Total credit over this page
        pageTotalCredits = api
          .column(columnIndex, { page: 'current'} )
          .data()
          .reduce((a, b) => {
              if($(b).attr('class') === 'text-danger') {
                return a;
              }
              let value = $(b).text().substr(1);
              return a + helpers.intVal(value);
          }, 0);
        
        pageTotalDebits = api
          .column(columnIndex, { page: 'current'} )
          .data()
          .reduce((a, b) => {
              if($(b).attr('class') === 'text-success') {
                return a;
              }
              let value = $(b).text().substr(1);
              return a + helpers.intVal(value);
          }, 0);

        // Update footer
        $(api.column(2).footer()).html(
            `Credit: $${helpers.round(pageTotalCredits, 2)} Debit: ($${helpers.round(pageTotalDebits, 2)})`
        );
    }
  });

  $('.dataTables_filter').addClass('float-right');
  $('.dataTables_paginate').addClass('float-right');
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

