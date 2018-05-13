class Store {
  constructor() {
    this.accounts = {};
    this.allCrypto = {};
    this.allAccounts = [];
    this.transactions = [];
    this.allTransactions = [];
    this.groups = [];
    this.netBalance = 0;
    this.cashBalance = 0;
    this.creditDebt = 0;
    this.cryptoBalance = 0;
    this.investmentBalance = 0;
  }

  cleanBalance(balances) {
    if(balances.limit !== null) {
      // is a credit card / line of credit
      return balances.current !== null ? balances.current : (balances.available !== null ? balances.limit - balances.available : -Infinity)
    }
    return balances.available !== null ? balances.available : (balances.current !== null ? balances.current : -Infinity);
  }

  addAccountCollection(accounts) {
    accounts.forEach(account => {
      this.addAccount(account);
    });
  }

  addGroupCollection (groups) {
    groups.forEach(group => {
      this.addGroup(group);
    });
  }

  addGroup (group) {
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

  addAllCrypto (crypto) {
    this.allCrypto = crypto;
  }

  addAllTransactions (transactions) {
    transactions.forEach(transactionObject => {
      transactionObject.transactions.forEach(transaction => {
        if(transaction.category && transaction.category.length) {
          transaction.mainCategory = transaction.category.shift();
        }
      });
      this.allTransactions = [...this.allTransactions, ...transactionObject.transactions];
    });

    this.transactions = transactions;
  }

  getTransactionsForDate (date) {
    return this.allTransactions.filter(transaction => transaction.date === date);
  }

  getTransactionsSummaryForMonth(date) {
    const transactionForDate = {
      debit: 0,
      credit: 0
    };

    this.allTransactions.forEach(transaction => {
      if(moment(transaction.date).isSame(date, 'month')) {
        if(transaction.amount < 0) {
          transactionForDate.credit -= transaction.amount;
        }
        else {
          transactionForDate.debit += transaction.amount;
        }
      }
    });

    return transactionForDate;
  }

  getTransactionsSummaryForWeek(date) {
    const transactionForDate = {
      debit: 0,
      credit: 0
    };

    this.allTransactions.forEach(transaction => {
      if(moment(transaction.date).isSame(date, 'week')) {
        if(transaction.amount < 0) {
          transactionForDate.credit -= transaction.amount;
        }
        else {
          transactionForDate.debit += transaction.amount;
        }
      }
    });

    return transactionForDate;
  }

  getTransactionsSummaryForDate (date) {
    const transactionForDate = {
      debit: 0,
      credit: 0
    };

    this.allTransactions.forEach(transaction => {
      if(transaction.date === date) {
        if(transaction.amount < 0) {
          transactionForDate.credit -= transaction.amount;
        }
        else {
          transactionForDate.debit += transaction.amount;
        }
      }
    });

    return transactionForDate;
  }

  getCryptoInformation(symbol) {
    return this.allCrypto.filter(c => c.symbol === symbol)[0];
  }
  
  addAccount (account) {
    Object.keys(account).forEach(type => {
      if(!this.accounts[type]) {
        this.accounts[type] = [];
      }
      this.accounts[type] = [...this.accounts[type], ...account[type]];
      this.allAccounts = [...this.allAccounts, ...account[type]];
    });
    this.recalculateBalance(account);
  }

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

  recalculateBalance () {
    this.investmentBalance = 0;
    this.creditDebt = 0;
    this.cashBalance = 0;
    this.cryptoBalance = 0;

    this.calculateBalance(this.accounts);
  }
};

module.exports = Store;