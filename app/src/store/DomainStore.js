import {
  observable,
  computed,
  action
} from 'mobx';

// Contains all high-level data

class DomainStore {
  @observable 
  plaidCredentials = {};

  @observable
  plaidInitialized = false;

  @observable
  plaidAvailable = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  @action.bound
  setPlaidCredentials(credentials) {
    this.plaidCredentials = credentials;
    this.plaidInitialized = true;

    if(!credentials.error) {
      this.plaidAvailable = true;
      this.rootStore.uiStore.addMessage('Plaid credentials found.');
    }
  }
}

export default DomainStore;