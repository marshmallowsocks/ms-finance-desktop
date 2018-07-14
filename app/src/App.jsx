import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { Provider } from 'mobx-react';

import Header from './components/Header';
import SideBar from './components/Sidebar';
import Content from './components/Content';
import Footer from './components/Footer';
import Splash from './components/Splash';

import api from './api';
import Store from './store';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialized: false
    };
    this.setActive = this.setActive.bind(this);
  }

  async initialFetchData() {
    const { 
      accountStore,
      transactionStore,
      uiStore,
    } = Store;

    try {
      const institutions = await api.getAllInstitutionData();
      
      if(!institutions.length) {
        uiStore.addMessage('No institutions linked. Fetching crypto data...');
        const crypto = await api.fetchCrypto();
        const cryptoAccounts = await api.getCryptoHoldings();
        accountStore.setupCryptoSuggestions(crypto);
        uiStore.addMessage('Crypto data fetched successfully.');
        if(cryptoAccounts.length === 0) {
          uiStore.addMessage('No crypto holdings found.');
          return {
            error: false,
            accountDataExists: false
          };
        }
        const cryptoAccountData = cryptoAccounts.map(cryptoAccount => {
          const data = crypto[cryptoAccount.crypto_id];
          data.holdings = cryptoAccount.holdings;
          return accountStore.createAccountObject(data);
        });
        
        accountStore.addAccountCollection(cryptoAccountData);
        uiStore.addMessage(`Initialized ${cryptoAccountData.length} crypto holdings.`)
        
        return {
          error: false,
          accountDataExists: true
        };
      }

      uiStore.addMessage(`Found ${institutions.length} institution(s).`);
      const accountPromises = [];
      const transactionPromises = [];
      const result = [];
      institutions.forEach(async (institution) => {
        uiStore.addMessage(`Fetching data for ${institution.name}...`);
        try {
          const accountResult = await api.fetchAccountData(institution.item_token);
          result.push(accountResult);
        }
        catch(e) {
          console.log(e);
        }
        try {
          const transactionResult = await api.fetchTransactionData(institution.item_token);
          result.push(transactionResult);
        }
        catch(e) {
          console.log(e);
        }
      });
      
      //const result = await Promise.all([...accountPromises, ...transactionPromises]);
      uiStore.addMessage(`Fetched ${institutions.length} institution(s) data. Fetching crypto data...`);
      const crypto = await api.fetchCrypto();
      const cryptoAccounts = await api.getCryptoHoldings();
      const groups = await api.getGroups();

      accountStore.setupCryptoSuggestions(crypto);
      const cryptoAccountData = cryptoAccounts.map(cryptoAccount => {
        const data = crypto[cryptoAccount.crypto_id];
        data.holdings = cryptoAccount.holdings;
        return accountStore.createAccountObject(data);
      });
      uiStore.addMessage('Adding all accounts and transactions...');
      accountStore.addAccountCollection([
        ...result.filter(r => r.type === 'accounts').map(r => r.data),
        ...cryptoAccountData
      ]);
      accountStore.addGroupCollection(groups);
      transactionStore.addAllTransactions([
        ...result.filter(r => r.type === 'transactions').map(r => r.data)
      ]);

      return {
        error: false,
        accountDataExists: true
      };
    }
    catch(e) {
      uiStore.addMessage('An error occurred. Check the logs for details.');
      throw Error(e);
    }
  }

  setActive(path) {
    const { uiStore } = Store;
    uiStore.setActivePath(path);
  }

  async componentDidMount() {
    const { uiStore, domainStore } = Store;

    if(!domainStore.plaidInitialized) {
      domainStore.plaidPending = true;
      await api.init();
      domainStore.plaidPending = false;
      this.setState({
        initialized: true
      });
    }

    this.setState({
      initialized: true
    });

    uiStore.toggleLoader(true);
    const readyStatus = await this.initialFetchData();

    if(!readyStatus.error) {
      uiStore.addMessage('Fetched data successfully!');
    }

    else {
      uiStore.addMessage('Could not fetch data.');
    }

    uiStore.toggleLoader(false);    
  }

  render() {
    let component;

    if(this.state.initialized) {
      component = (
        <Provider store={Store}>
        <Router>
          <div>
            <SideBar />
            <Content setActive={this.setActive} />
            <Footer />
          </div>
        </Router>
      </Provider>
      );
    }
    else {
      component = (<Splash />);
    }

    return component;
  }
}

