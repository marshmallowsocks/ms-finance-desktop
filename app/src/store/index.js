import {
  observable,
  computed,
  action
} from 'mobx';

import DomainStore from './DomainStore';
import UIStore from './UIStore';
import AccountStore from './AccountStore';
import TransactionStore from './TransactionsStore';

class ObservableMSFinanceStore {

  constructor() {
    if(!ObservableMSFinanceStore.instance) {
      this.domainStore = new DomainStore(this);
      this.uiStore = new UIStore(this);
      this.accountStore = new AccountStore(this);
      this.transactionStore = new TransactionStore(this);
      ObservableMSFinanceStore.instance = this;
    }

    return ObservableMSFinanceStore.instance;
  }
}

const instance = new ObservableMSFinanceStore();
export default instance;