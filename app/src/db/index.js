import Dexie from 'dexie';
import IDBExportImport from 'indexeddb-export-import';

class DB {
  constructor() {
    if(!DB.instance) {
      this.db = new Dexie('ms-finance-desktop-react-testing');
      this.db.version(1).stores({
        access_tokens: '++id, access_token, item_token',
        institutions: '++id, name, institution_id, item_token, products',
        crypto: '++id, crypto_id, name, symbol, holdings',
        groups: '++id, name, accounts',
        plaid: '++id, client_id, public_key, secret',
      });
      DB.instance = this;
    }

    return DB.instance;
  }

  async getPlaidCredentials() {
    const plaid = await this.db.plaid.toArray();
    if(!plaid || plaid.length === 0) {
      return {
        error: true,
        message: 'No plaid credentials found.',
      };
    }

    return plaid[0];
  }

  async savePlaidCredentials({public_key, client_id, secret}) {
    await this.db.plaid.add({
      public_key,
      client_id,
      secret
    });

    return {
      error: false,
      message: 'Saved plaid credentials',
    };
  }

  async exportDatabase() {
    return new Promise((resolve, reject) => {
      this.db.open().then(() => {
        const idbDb = this.db.backendDB();
  
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
  }

  async importDatabase(jsonString) {
    return new Promise((resolve, reject) => {
      this.db.open().then(() => {
        const idbDb = this.db.backendDB();
        
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
  }

  async addGroup ({name, accounts}) {
    return this.db.groups.add({name, accounts});
  }

  async getGroups() {
    return this.db.groups.toArray();
  }

  async deleteGroup(groupId) {
    return this.db.groups.where('id').equals(groupId).delete();
  }
  
  async getCryptoHoldings() {
    return this.db.crypto.toArray();
  }

  async saveCryptoHolding ({
    crypto_id, name, symbol, holdings, // eslint-disable-line camelcase
  }) {
    const exists = await this.db.crypto.where('symbol').equals(symbol).first();
    if (exists) {
      await this.db.crypto.put({
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
      await this.db.crypto.add({
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
  }

  async deleteCryptoHolding(cryptoId) {
    return this.db.crypto.where('crypto_id').equals(cryptoId).delete();
  }

  async saveAccessToken(access_token, item_token) { // eslint-disable-line camelcase
    return this.db.access_tokens.add({
      access_token,
      item_token,
    });
  }

  async getLatestAccessToken() {
    return this.db.access_tokens
      .orderBy('id')
      .reverse()
      .first();
  }

  async getAccessTokens() {
    return this.db.access_tokens.toArray();
  }

  async getAccessTokenById(itemId) {
    return this.db.access_tokens
      .where('item_token')
      .equals(itemId)
      .first();
  }
  async saveInstitution({
    name,
    institution_id, // eslint-disable-line camelcase
    item_token, // eslint-disable-line camelcase
    products,
  }) {
    return this.db.institutions.add({
      name,
      institution_id,
      products,
      item_token, // eslint-disable-line camelcase
    })
  }
  async getInstitutions() {
    const institutions = await this.db.institutions.toArray();
    institutions.forEach((institution) => {
      institution.products = institution.products.split(','); // eslint-disable-line
    });
    return institutions;
  }
  async getInstitutionById(itemId) {
    return this.db.institutions
      .where('item_token')
      .equals(itemId)
      .first();
  }
}

const instance = new DB();
Object.freeze(instance);
export default instance;
