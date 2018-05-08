const Dexie = require('dexie');

const db = new Dexie('ms-finance-desktop');

const dbApi = {
  init: () => {
    db.version(1).stores({
      access_tokens: '++id, access_token, item_token',
      institutions: '++id, name, institution_id, item_token, products',
      crypto: '++id, crypto_id, name, symbol, holdings',
    });
    db.version(11).stores({
      access_tokens: '++id, access_token, item_token',
      institutions: '++id, name, institution_id, item_token, products',
      crypto: '++id, crypto_id, name, symbol, holdings',
    });
  },
  getCryptoHoldings: async () => db.crypto.toArray(),
  saveCryptoHolding: async ({
    crypto_id, name, symbol, holdings, // eslint-disable-line camelcase
  }) => {
    const exists = await db.crypto.where('symbol').equals(symbol).first();
    if(exists) {
      await db.crypto.put({
        id: exists.id,
        crypto_id,
        name,
        symbol,
        holdings: parseInt(holdings, 10) + parseInt(exists.holdings, 10),
      });
      
      return {
        exists: true,
        error: false
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
