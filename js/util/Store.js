const db = require('../util/db');

let Store = function() {
  this.cleanBalance = (balances) => {
    if(balances.limit) {
      // is a credit card / line of credit
      return balances.current ? balances.current : (balances.available ? balances.limit - balances.available : -Infinity)
    }
    return balances.available ? balances.available : (balances.current ? balances.current : -Infinity);
  }

  this.addAccountCollection = (accounts) => {
    accounts.forEach(account => {
      this.addAccount(account);
    });
  }

  this.addAllCrypto = (crypto) => {
    this.allCrypto = crypto;
  }

  this.addAllTransactions = (transactions) => {
    this.transactions = transactions;
  }

  this.getCryptoInformation = symbol => this.allCrypto.filter(c => c.symbol === symbol)[0];

  this.addAccount = (account) => {
    Object.keys(account).forEach(type => {
      if(!this.accounts[type]) {
        this.accounts[type] = [];
      }
      this.accounts[type] = [...this.accounts[type], ...account[type]];
      this.allAccounts = [...this.allAccounts, ...account[type]];
    });
    this.calculateBalance(account);
  }

  this.calculateBalance = (accounts) => {
    // updates the balance.

    Object.keys(accounts).forEach(type => {
      accounts[type].forEach(account => {
        const balance = this.cleanBalance(account.balances);
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

  this.recalculateBalance = () => {
    this.investmentBalance = 0;
    this.creditDebt = 0;
    this.cashBalance = 0;
    this.cryptoBalance = 0;

    this.calculateBalance(this.accounts);
  }
  
  this.accounts = {};
  this.allCrypto = {};
  this.allAccounts = [];
  this.transactions = [];
  this.netBalance = 0;
  this.cashBalance = 0;
  this.creditDebt = 0;
  this.cryptoBalance = 0;
  this.investmentBalance = 0;
};

module.exports = Store;