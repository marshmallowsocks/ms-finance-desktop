let Store = function() {
  this.cleanBalance = (balances) => {
    if(balances.limit !== null) {
      // is a credit card / line of credit
      return balances.current !== null ? balances.current : (balances.available !== null ? balances.limit - balances.available : -Infinity)
    }
    return balances.available !== null ? balances.available : (balances.current !== null ? balances.current : -Infinity);
  }

  this.addAccountCollection = (accounts) => {
    accounts.forEach(account => {
      this.addAccount(account);
    });
  }

  this.addGroupCollection = (groups) => {
    groups.forEach(group => {
      this.addGroup(group);
    });
  }

  this.addGroup = (group) => {
    const groupData = {
      id: group.id,
      name: group.name,
      accounts: []
    };
    
    group.accounts.forEach(accountId => {
      groupData.accounts.push(
        this.allAccounts.filter(account => account.account_id === accountId)[0]
      );
    });
    
    this.groups.push(groupData);
  }

  this.deleteGroup = (groupId) => {
    let index;

    for(let i = 0; i < this.groups.length; i++) {
      if(this.groups[i].id === groupId) {
        index = i;
        break;
      }
    }

    this.groups = this.groups.splice(index, 1);
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
    this.recalculateBalance(account);
  }

  this.calculateBalance = (accounts) => {
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
  this.groups = [];
  this.netBalance = 0;
  this.cashBalance = 0;
  this.creditDebt = 0;
  this.cryptoBalance = 0;
  this.investmentBalance = 0;
};

module.exports = Store;