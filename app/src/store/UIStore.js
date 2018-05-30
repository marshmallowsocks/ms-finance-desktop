import {
  observable,
  computed,
  action
} from 'mobx';

class UIStore {
  @observable
  loading = false;

  @observable
  messages = [];

  @observable
  activePath = 'overview';

  constructor(rootStore) {
    this.rootStore = rootStore;
  }
  
  @computed
  get latestMessage() {
    return this.messages.length ? this.messages[0] : 'Nothing to report.';
  }

  @action.bound
  toggleLoader(show) {
    this.loading = show;
  }

  @action.bound
  addMessage(message) {
    this.messages.unshift(message);
  }

  @action.bound
  setActivePath(path) {
    this.activePath = path;
  }
}

export default UIStore;