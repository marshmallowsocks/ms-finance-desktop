const plaid = require('plaid');
const moment = require('moment');
const fs = require('fs');

const constants = require('../constants');
const db = require('../db');
const helpers = require('../util/helpers');

let client;

const api = {
  init: async () => {
    db.init();
    const plaidCredentials = await db.getPlaidCredentials();
    if(plaidCredentials.error) {
      return plaidCredentials;
    }
    client = new plaid.Client(
      plaidCredentials.client_id,
      plaidCredentials.secret,
      plaidCredentials.public_key,
      plaid.environments[constants.plaid.PLAID_ENV],
    );
    return {
      error: false,
      message: 'API initialized',
      plaidCredentials,
    };
  },
  savePlaidCredentials: async ({publicKey, clientId, secret}) => {
    await db.savePlaidCredentials({
      public_key: publicKey,
      client_id: clientId,
      secret
    });

    return {
      error: false,
      message: 'Saved Plaid credentials.'
    };
  },
  exportDatabase: () => {
    return new Promise((resolve, reject) => {
      db.exportDatabase().then(result => {
        fs.writeFile('exportedDB.json', result, err => {
          resolve({
            error: false
          });
        });
      });
    });
  },
  importDatabase: (jsonString) => {
    return new Promise((resolve, reject) => {
      db.importDatabase(jsonString).then(result => {
        if(result.error) {
          reject({
            error: true
          });
        }

        resolve({
          error: false
        });
      });
    });
  },
  createGroup: (name, accounts) => {
    return new Promise((resolve, reject) => {
      db.addGroup({name, accounts}).then(res => {
        resolve({
          error: false,
          message: 'Group created!',
        });
      }).catch(err => {
        reject(Error(err));
      });
    });
  },
  getGroups: () => {
    return new Promise((resolve, reject) => {
      db.getGroups().then(res => {
        resolve(res);
      }).catch(err => {
        reject(Error(err));
      });
    });
  },
  deleteGroup: groupId => {
    return new Promise((resolve, reject) => {
      db.deleteGroup(groupId).then(res => {
        resolve({
          error: false
        });
      }).catch(err => {
        reject(Error(err));
      });
    });
  },
  exchangePublicToken: publicToken => new Promise((resolve, reject) => {
    client.exchangePublicToken(publicToken, (error, tokenResponse) => {
      let message;
      if (error != null) {
        message = 'Could not exchange public token';
        reject(new Error({
          message,
          error: true,
        }));
      }

      const ACCESS_TOKEN = tokenResponse.access_token;
      const ITEM_ID = tokenResponse.item_id;
      db.saveAccessToken(ACCESS_TOKEN, ITEM_ID);
      message = 'Successfully exchanged public token';
      resolve({
        message,
        error: false,
      });
    });
  }),
  getAllAccessTokens: async () => new Promise((resolve, reject) => {
    db.getAccessTokens()
      .then(result => resolve(result))
      .catch(err => reject(err));
  }),
  getLatestAccessToken: async () => new Promise((resolve, reject) => {
    db.getLatestAccessToken()
      .then(result => resolve(result))
      .catch(err => reject(err));
  }),
  fetchLatestInstitutionData: async () => new Promise((itemResolve, itemReject) => {
    db.getLatestAccessToken()
      .then((token) => {
        client.getItem(token.access_token, (error, itemResponse) => {
          if (error != null) {
            itemReject(new Error({
              error: true,
              message: 'Could not get item information.',
              errorBody: error,
            }));
          }
          client.getInstitutionById(itemResponse.item.institution_id, (err, instRes) => {
            if (err != null) {
              itemReject(new Error({
                error: true,
                message: 'Could not get institution information',
                errorBody: err,
              }));
            }
            db.saveInstitution({
              name: instRes.institution.name,
              item_token: itemResponse.item.item_id,
              institution_id: instRes.institution.institution_id,
              products: instRes.institution.products.join(),
            }).then(() => {
              itemResolve({
                name: instRes.institution.name,
                itemId: itemResponse.item.item_id,
                products: instRes.institution.products,
              });
            });
          });
        });
      });
  }),
  getAllInstitutionData: async () => new Promise((resolve, reject) => {
    db.getInstitutions()
      .then(institutions => resolve(institutions))
      .catch(err => reject(new Error(err)));
  }),
  getCryptoHoldings: async () => new Promise((resolve, reject) => {
    db.getCryptoHoldings()
      .then(crypto => resolve(crypto))
      .catch(err => reject(new Error(err)));
  }),
  saveCryptoHolding: async saveObject => new Promise((resolve, reject) => {
    db.saveCryptoHolding(saveObject)
      .then(result => resolve({ saved: true, exists: result.exists }))
      .catch(err => reject(Error(err)));
  }),
  fetchAccountData: async itemId => new Promise((resolve, reject) => {
    db.getAccessTokenById(itemId)
      .then((accessTokenObject) => {
        client.getAccounts(accessTokenObject.access_token, (err, accountsResponse) => {
          if (err != null) {
            reject(err);
          }
          db.getInstitutionById(itemId)
            .then((institution) => {
              accountsResponse.accounts.forEach((account) => {
                account.institutionName = institution.name; // eslint-disable-line
              });
              resolve({
                type: 'accounts',
                data: helpers.groupBy(accountsResponse.accounts, 'type')
              });
            })
            .catch((error) => {
              reject(error);
            });
        });
      });
  }),
  fetchTransactionData: async itemId => new Promise((resolve, reject) => {
    db.getAccessTokenById(itemId)
      .then(accessTokenObject => {
        client.getTransactions(
          accessTokenObject.access_token,
          moment().startOf('year').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD'),
          (err, transactionsResponse) => {
            if(err != null) {
              reject(Error(JSON.stringify(err)));
            }
            resolve({
              type: 'transactions',
              data: transactionsResponse
            });
          });
      });
  }),
  fetchCrypto: async () => new Promise((resolve, reject) => {
    $.get(constants.crypto.INFORMATION, (crypto) => { // eslint-disable-line
      resolve(crypto.data);
    })
      .fail((err) => {
        reject(new Error({
          error: true,
          message: 'Could not fetch crypto data.',
          errorBody: err,
        }));
      });
  }),
};

module.exports = api;