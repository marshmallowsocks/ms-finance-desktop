import plaid from 'plaid';
import moment from 'moment';
import fs from 'fs';

import constants from '../constants';
import db from '../db';
import helpers from '../util/helpers';
import store from '../store';

class API {
  constructor() {
    if(!API.instance) {
      API.instance = this;
      API.isInitialized = false;
    }
    return API.instance;
  }
  async init() {
    if(API.isInitialized) {
      throw Error({
        error: true,
        message: 'Do not reinitialize API.',
      });
    }

    const plaidCredentials = await db.getPlaidCredentials();
    if(plaidCredentials.error) {
      store.domainStore.setPlaidCredentials({
        error: 'NOT_FOUND'
      });
      return {
        error: true,
        type: 'NOT_FOUND'
      };
    }
    this.client = new plaid.Client(
      plaidCredentials.client_id,
      plaidCredentials.secret,
      plaidCredentials.public_key,
      plaid.environments[constants.plaid.PLAID_ENV],
    );
    API.isInitialized = true;
    store.domainStore.setPlaidCredentials(plaidCredentials);
    return {
      error: false
    };
  }

  async savePlaidCredentials({publicKey, clientId, secret}) {
    await db.savePlaidCredentials({
      public_key: publicKey,
      client_id: clientId,
      secret
    });

    store.domainStore.setPlaidCredentials({
      public_key: publicKey,
      client_id: clientId,
      secret
    });
  }

  exportDatabase() {
    return new Promise((resolve, reject) => {
      db.exportDatabase().then(result => {
        fs.writeFile('exportedDB.json', result, err => {
          if(err) {
            reject({
              error: true
            });
          }
          resolve({
            error: false
          });
        });
      });
    });
  }

  importDatabase(jsonString) {
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
  }

  createGroup(name, accounts) {
    return new Promise((resolve, reject) => {
      db.addGroup({name, accounts}).then(res => {
        resolve({
          error: false,
          id: res,
          message: 'Group created!',
        });
      }).catch(err => {
        reject(Error(err));
      });
    });
  }

  getGroups() {
    return new Promise((resolve, reject) => {
      db.getGroups().then(res => {
        resolve(res);
      }).catch(err => {
        reject(Error(err));
      });
    });
  }

  deleteGroup(groupId) {
    return new Promise((resolve, reject) => {
      db.deleteGroup(groupId).then(res => {
        resolve({
          error: false
        });
      }).catch(err => {
        reject(Error(err));
      });
    });
  }

  exchangePublicToken(publicToken) {
    return new Promise((resolve, reject) => {
      this.client.exchangePublicToken(publicToken, (error, tokenResponse) => {
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
    });
  }

  getAllAccessTokens() {
    return new Promise((resolve, reject) => {
      db.getAccessTokens()
        .then(result => resolve(result))
        .catch(err => reject(err));
    });
  }

  getLatestAccessToken() {
    return new Promise((resolve, reject) => {
      db.getLatestAccessToken()
        .then(result => resolve(result))
        .catch(err => reject(err));
    });
  }

  fetchLatestInstitutionData() {
    return new Promise((itemResolve, itemReject) => {
      db.getLatestAccessToken()
        .then((token) => {
          this.client.getItem(token.access_token, (error, itemResponse) => {
            if (error != null) {
              itemReject(new Error({
                error: true,
                message: 'Could not get item information.',
                errorBody: error,
              }));
            }
            this.client.getInstitutionById(itemResponse.item.institution_id, (err, instRes) => {
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
    });
  }

  getAllInstitutionData() {
    return new Promise((resolve, reject) => {
      db.getInstitutions()
        .then(institutions => resolve(institutions))
        .catch(err => reject(new Error(err)));
    });
  }

  getCryptoHoldings() {
    return new Promise((resolve, reject) => {
      db.getCryptoHoldings()
        .then(crypto => resolve(crypto))
        .catch(err => reject(new Error(err)));
    });
  }
  
  saveCryptoHolding(saveObject) {
    return new Promise((resolve, reject) => {
      db.saveCryptoHolding(saveObject)
        .then(result => resolve({ saved: true, exists: result.exists }))
        .catch(err => reject(Error(err)));
    });
  }

  fetchAccountData(itemId) {
    return new Promise((resolve, reject) => {
      db.getAccessTokenById(itemId)
        .then((accessTokenObject) => {
          this.client.getAccounts(accessTokenObject.access_token, (err, accountsResponse) => {
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
    })
  }

  fetchTransactionData(itemId) {
    return new Promise((resolve, reject) => {
      db.getAccessTokenById(itemId)
        .then(accessTokenObject => {
          this.client.getTransactions(
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
    });
  }

  fetchCrypto() {
    return new Promise((resolve, reject) => {
      fetch(constants.crypto.INFORMATION)
      .then(res => res.json())
      .then(crypto => {
        resolve(crypto.data);
      })
      .catch(err => {
        reject(
          new Error({
            error: true,
            message: 'Could not fetch crypto data.',
            errorBody: err,
          })
        );
      });
    });
  }
}

const instance = new API();
export default instance;
