const Dexie = require('dexie');
const IDBExportImport = require('indexeddb-export-import')

const db = new Dexie('ms-finance-desktop');

const dbApi = {
  init: () => {
    db.version(1).stores({
      access_tokens: '++id, access_token, item_token',
      institutions: '++id, name, institution_id, item_token, products',
      crypto: '++id, crypto_id, name, symbol, holdings',
    });
    db.version(2).stores({
      access_tokens: '++id, access_token, item_token',
      institutions: '++id, name, institution_id, item_token, products',
      crypto: '++id, crypto_id, name, symbol, holdings',
      groups: '++id, name, accounts',
    });
    db.version(3).stores({
      access_tokens: '++id, access_token, item_token',
      institutions: '++id, name, institution_id, item_token, products',
      crypto: '++id, crypto_id, name, symbol, holdings',
      groups: '++id, name, accounts',
      plaid: '++id, client_id, public_key, secret',
    });
  },
  getPlaidCredentials: async () => {
    const plaid = await db.plaid.toArray();
    if(!plaid || plaid.length === 0) {
      return {
        error: true,
        message: 'No plaid credentials found.'
      };
    }

    return plaid[0];
  },
  savePlaidCredentials: async ({public_key, client_id, secret}) => {
    await db.plaid.add({
      public_key,
      client_id,
      secret
    });

    return {
      error: false,
      message: 'Saved plaid credentials'
    };
  },
  exportDatabase: async () => {
    return new Promise((resolve, reject) => {
      db.open().then(() => {
        const idbDb = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
  
        IDBExportImport.exportToJsonString(idbDb, (err, jsonString) => {
          if (err) {
            reject(Error({
              error: true,
              errorMessage: 'Could not export database'
            }));
          }
          else {
            resolve(jsonString);
          }
        });
      }).catch((e) => {
        reject(Error({
          error: true,
          errorMessage: 'Could not export database.'
        }));
      });
    });
  },
  importDatabase: async (jsonString) => {
    return new Promise((resolve, reject) => {
      db.open().then(() => {
        const idbDb = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
        
        IDBExportImport.importFromJsonString(idbDb, jsonString, (err, jsonString) => {
          if (err) {
            reject(Error({
              error: true,
              errorMessage: 'Could not import database'
            }));
          }
          else {
            resolve({
              error: false
            });
          }
        });
      }).catch((e) => {
        reject(Error({
          error: true,
          errorMessage: 'Could not import database.'
        }));
      });
    });
  },
  addGroup: async ({name, accounts}) => db.groups.add({name, accounts}),
  getGroups: async () => db.groups.toArray(),
  deleteGroup: async groupId => db.groups.where('id').equals(groupId).delete(),
  getCryptoHoldings: async () => db.crypto.toArray(),
  saveCryptoHolding: async ({
    crypto_id, name, symbol, holdings, // eslint-disable-line camelcase
  }) => {
    const exists = await db.crypto.where('symbol').equals(symbol).first();
    if (exists) {
      await db.crypto.put({
        id: exists.id,
        crypto_id,
        name,
        symbol,
        holdings: parseInt(holdings, 10) + parseInt(exists.holdings, 10),
      });

      return {
        exists: true,
        error: false,
      };
    }
    else {
      await db.crypto.add({
        crypto_id,
        name,
        symbol,
        holdings,
      });

      return {
        exists: false,
        error: false
      };
    }
  },
  deleteCryptoHolding: async cryptoId => db.crypto.where('crypto_id').equals(cryptoId).delete(),
  saveAccessToken: async (access_token, item_token) => // eslint-disable-line camelcase
    db.access_tokens.add({
      access_token,
      item_token,
    }),
  getLatestAccessToken: async () =>
    db.access_tokens
      .orderBy('id')
      .reverse()
      .first(),
  getAccessTokens: async () => db.access_tokens.toArray(),
  getAccessTokenById: async itemId =>
    db.access_tokens
      .where('item_token')
      .equals(itemId)
      .first(),
  saveInstitution: async ({
    name,
    institution_id, // eslint-disable-line camelcase
    item_token, // eslint-disable-line camelcase
    products,
  }) =>
    db.institutions.add({
      name,
      institution_id,
      products,
      item_token, // eslint-disable-line camelcase
    }),
  getInstitutions: async () => {
    const institutions = await db.institutions.toArray();
    institutions.forEach((institution) => {
      institution.products = institution.products.split(','); // eslint-disable-line
    });
    return institutions;
  },
  getInstitutionById: async itemId =>
    db.institutions
      .where('item_token')
      .equals(itemId)
      .first(),
};

module.exports = dbApi;
