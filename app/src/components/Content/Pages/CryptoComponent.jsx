import React from 'react';
import PropTypes from 'prop-types';
import {
  observer,
  inject
} from 'mobx-react';
import { 
  Alert,
  Badge,
  Button,
} from 'reactstrap';

import api from '../../../api';
import Title from '../Title';
import { CryptoCard } from '../../Cards';

@inject('store')
@observer
class CryptoComponent extends React.Component {
  constructor(props) {
    super(props);
    this.recurringPrice = null;
    this.fetchCrypto = this.fetchCrypto.bind(this);
  }

  componentDidMount() {
    if(this.recurringPrice) {
      clearInterval(this.recurringPrice);
    }
    this.recurringPrice = setInterval(() => {
      this.fetchCrypto();
    }, 150 * 1000); //update frequency of 2.5 minutes.
  }

  async fetchCrypto() {
    const { accountStore, uiStore } = this.props.store;
    uiStore.addMessage('Fetching latest crypto information...');
    uiStore.toggleLoader(true);
    
    
    const crypto = await api.fetchCrypto();
    const cryptoAccounts = await api.getCryptoHoldings();

    accountStore.setupCryptoSuggestions(crypto);
    
    const cryptoAccountData = cryptoAccounts.map(cryptoAccount => {
      const data = crypto[cryptoAccount.crypto_id];
      data.holdings = cryptoAccount.holdings;
      return accountStore.createAccountObject(data);
    });
    
    accountStore.updateCrypto(cryptoAccountData);
    
    uiStore.addMessage('Crypto data updated.');
    uiStore.toggleLoader(false);
  }

  render() {
    const { accountStore } = this.props.store;
    const accounts = (accountStore.accounts['crypto'] || []).map(account => {
      return <CryptoCard 
        key={account.account_id}
        title={account.name}
        color={'success'}
        subtitle={account.mask}
        cryptoInformation={account.cryptoInformation}
        additionalInfo={account.additionalInfo}
        balance={accountStore.cleanBalance(account.balances)}
      />;
    });
    return (
      <div>
        <Title
          title={this.props.title}
          contextBalance={accountStore.cryptoBalance}
          color={'success'}
        />
        {
          accounts.length === 0 ? 
          <Alert color="info">Add a cryptocurrency to get started.</Alert> :
          accounts
        }
      </div>
    );
  }
};

CryptoComponent.propTypes = {
  title: PropTypes.string.isRequired
};

export default CryptoComponent;