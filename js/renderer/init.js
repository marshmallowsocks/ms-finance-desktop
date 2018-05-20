const dom = require('./dom');
const api = require('../api');
const constants = require('../constants');
const Store = require('../store');

const pageInit = async () => {
  // remove splash screen and show main screen.
  $('.splash-header').addClass('animated fadeOut');
  $('body').addClass('loaded');
  $('nav.flex-md-nowrap').addClass('fixed-top');
  dom.showLoader();
  $('#messageModal').modal({ show: false });
  
  const initialFetchData = async () => {
    try {
      const institutions = await api.getAllInstitutionData();
      
      if(!institutions.length) {
        const crypto = await api.fetchCrypto();
        const cryptoAccounts = await api.getCryptoHoldings();
        dom.setupCryptoSuggestions(crypto);
        if(cryptoAccounts.length === 0) {
          return {
            error: false,
            accountDataExists: false
          };
        }
        const cryptoAccountData = cryptoAccounts.map(cryptoAccount => {
          const data = crypto[cryptoAccount.crypto_id];
          data.holdings = cryptoAccount.holdings;
          return dom.createAccountObject(data);
        });
        Store.addAccountCollection(cryptoAccountData);
        
        return {
          error: false,
          accountDataExists: true
        };
      }

      const accountPromises = [];
      const transactionPromises = [];
      
      institutions.forEach(institution => {
        accountPromises.push(api.fetchAccountData(institution.item_token));
        transactionPromises.push(api.fetchTransactionData(institution.item_token));
      });
      
      const result = await Promise.all([...accountPromises, ...transactionPromises]);
      const crypto = await api.fetchCrypto();
      const cryptoAccounts = await api.getCryptoHoldings();
      const groups = await api.getGroups();

      dom.setupCryptoSuggestions(crypto);
      const cryptoAccountData = cryptoAccounts.map(cryptoAccount => {
        const data = crypto[cryptoAccount.crypto_id];
        data.holdings = cryptoAccount.holdings;
        return dom.createAccountObject(data);
      });

      Store.addAccountCollection([
        ...result.filter(r => r.type === 'accounts').map(r => r.data),
        ...cryptoAccountData
      ]);
      Store.addGroupCollection(groups);
      Store.addAllTransactions([
        ...result.filter(r => r.type === 'transactions').map(r => r.data)
      ]);

      return {
        error: false,
        accountDataExists: true
      };
    }
    catch(e) {
      throw Error(e);
    }
  };

  try {
    const apiReadyState = await api.init();
    if(apiReadyState.error) {
      dom.hideLoader();
      $('#modalMessage').html(`${markup.drawPlaidForm()}`);
      $('#messageModal').modal('show');
      $('#plaidDBFormSubmit').on('click', e => {
        clientId = $('#plaidClientId').val();
        publicKey = $('#plaidPublicKey').val();
        secret = $('#plaidSecretKey').val();

        api.savePlaidCredentials({
          clientId,
          publicKey,
          secret
        }).then(res => {
          const { app } = require('electron').remote;
          app.relaunch();
          app.exit(0);
        });
      });
    }
    else {
      handler = Plaid.create({
        apiVersion: 'v2',
        clientName: 'Marshmallowsocks Finance',
        env: constants.plaid.PLAID_ENV,
        product: ['transactions'],
        key: apiReadyState.plaidCredentials.public_key,
        onSuccess: async function(public_token) {
          try {
            const result = await api.exchangePublicToken(public_token);
            if(!result.error) {
              const { name, itemId, products } = await api.fetchLatestInstitutionData();
              const accountData = await api.fetchAccountData(itemId);
              Store.addAccount(accountData.data);
              dom.triggerRefresh({
                multiple: true,
                without: ['crypto', 'groups']
              });
            }
          }
          catch(e) {
            throw Error(e);
          }
        },
        onExit: function(err, metadata) {
          console.log('Plaid Link exit!');
          console.log(err);
          dom.hideLoader();
        }
      });
    }
  }
  catch(e) {
    dom.drawError();
    throw e;
    return {
      error: true,
      message: 'Page initialization failed.',
    };
  }
  try {
    const readyState = await initialFetchData();
    if(readyState.accountDataExists) {
      dom.drawAll();
    }
    else {
      dom.drawNone();
    }
  }
  catch(e) {
    dom.drawError();
    throw e;
  }
};

module.exports = pageInit;