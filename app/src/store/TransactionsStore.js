import {
  observable,
  computed,
  action
} from 'mobx';
import moment from 'moment';

class TransactionStore {
  
  @observable
  transactions = [];

  @observable
  allTransactions = [];
  
  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  @action.bound
  addAllTransactions (transactions) {
    const creditCardPayment = /.*payment.*thank you.*/gmi;

    transactions.forEach(transactionObject => {
      transactionObject.transactions.forEach(transaction => {
        transaction.institutionName = transactionObject.accounts.filter(a => a.account_id === transaction.account_id)[0].name;
        
        if(creditCardPayment.test(transaction.name)) {
          transaction.category.unshift('Credit Card Payment');
          transaction.ignore = !this.ignoreTransfers;
        }
        if(transaction.category && transaction.category.length) {
          transaction.mainCategory = transaction.category.shift();
        }
        if(transaction.mainCategory === 'Transfer') {
          transaction.ignore = !this.ignoreTransfers;
        }
      });
      this.allTransactions = [...this.allTransactions, ...transactionObject.transactions];
    });

    this.transactions = transactions;
  }

  getTransactionsOnDate (date) {
    return this.allTransactions.filter(t => t.date === date);
  }

  getTransactionsAggregateForTimescale(timeScale, date) {
    const transactionForDate = {
      debit: 0,
      credit: 0
    };
    let timeScaleTest;

    switch(timeScale) {
      case 'date':
        timeScaleTest = (date1, date2) => date1 === date2;
        break;
      case 'week':
        timeScaleTest = (date1, date2) => moment(date1).isSame(date2, 'week');
        break;
      case 'month':
        timeScaleTest = (date1, date2) => moment(date1).isSame(date2, 'month');
        break;
    }

    this.allTransactions.forEach(transaction => {
      if(timeScaleTest(transaction.date, date) && !transaction.ignore) {
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
}

export default TransactionStore;