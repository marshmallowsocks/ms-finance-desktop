import {
  observable,
  computed,
  action
} from 'mobx';
import moment from 'moment';

class AccountStore {
  
  @observable
  accounts = {};

  @observable
  allAccounts = [];

  @observable
  allCrypto = [];

  @observable
  groups = [];

  @observable
  netBalance = 0;

  @observable
  cashBalance = 0;
  
  @observable
  investmentBalance = 0;
  
  @observable
  cryptoBalance = 0;
  
  @observable
  creditDebt = 0;
  
  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  cleanBalance(balances) {
    if(balances.limit !== null) {
      // is a credit card / line of credit
      return balances.current !== null ? balances.current : (balances.available !== null ? balances.limit - balances.available : -Infinity)
    }
    return balances.available !== null ? balances.available : (balances.current !== null ? balances.current : -Infinity);
  }
  
  @action
  addAccountCollection (accounts) {
    accounts.forEach(account => {
      this.addAccount(account);
    });
  }

  @action
  updateCrypto (accounts) {
    this.accounts['crypto'] = [];
    let i = this.allAccounts.length;
    while (i--) {
      if (this.allAccounts[i].type === 'crypto') { 
          this.allAccounts.splice(i, 1);
      } 
    }
    accounts.forEach(account => {
      this.accounts['crypto'] = [...this.accounts['crypto'], ...account['crypto']];
      this.allAccounts = [...this.allAccounts, ...account['crypto']];
    });
  }

  @action
  addAccount (account) {
    Object.keys(account).forEach(type => {
      if(!this.accounts[type]) {
        this.accounts[type] = [];
      }
      this.accounts[type] = [...this.accounts[type], ...account[type]];
      this.allAccounts = [...this.allAccounts, ...account[type]];
    });
    
    this.recalculateBalance();
  }

  @action
  calculateBalance (accounts) {
    // updates the balance.

    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        const balance = this.cleanBalance(account.balances);
        if(balance === -Infinity) {
          return;
        }
        switch(type) {
          case 'brokerage':
            this.investmentBalance += balance;
            break;
          case 'depository':
            this.cashBalance += balance;
            break;
          case 'credit':
            this.creditDebt += balance;
            break;
          case 'crypto':
            this.cryptoBalance += balance;
            break;
        }
      });
    });
    this.netBalance = this.cashBalance + this.investmentBalance + this.cryptoBalance - this.creditDebt;
  }

  @action
  recalculateBalance () {
    this.investmentBalance = 0;
    this.creditDebt = 0;
    this.cashBalance = 0;
    this.cryptoBalance = 0;

    this.calculateBalance(this.accounts);
  }

  @action
  setupCryptoSuggestions(crypto) {
    const source = [];
    Object.keys(crypto).forEach(key => {
      source.push(crypto[key]);
    });

    this.allCrypto = source;
  }

  @action
  addGroupCollection (groups) {
    groups.forEach(group => {
      this.addGroup(group);
    });
  }

  @action
  addGroup (group) {
    const groupData = {
      id: group.id,
      name: group.name,
      accounts: []
    };
    
    group.accounts.forEach(accountId => {
      groupData.accounts.push(
        this.allAccounts.filter(account => account.account_id == accountId)[0]
      );
    });
    
    this.groups.push(groupData);
  }

  @action
  deleteGroup (groupId) {
    let index;

    for(let i = 0; i < this.groups.length; i++) {
      if(this.groups[i].id === groupId) {
        index = i;
        break;
      }
    }

    this.groups = this.groups.splice(index, 1);
  }

  getCryptoInformation(symbol) {
    return this.allCrypto.filter(c => c.symbol === symbol)[0];
  }

  createAccountObject(crypto, holdings) {
    const storeObject = {};
    storeObject.crypto = [];
    storeObject.crypto.push({
      account_id: crypto.id,
      balances: {
        available: (crypto.holdings || holdings) * crypto.quotes.USD.price,
        current: null,
        limit: null,
      },
      institutionName: crypto.symbol,
      mask: `Holdings: ${crypto.holdings || holdings} ${crypto.symbol}`,
      cryptoInformation: {
        lastUpdated: crypto.last_updated,
        price: crypto.quotes.USD.price,
      },
      name: crypto.name,
      subtype: 'crypto',
      type: 'crypto'
    });

    return storeObject;
  }
}

export default AccountStore;