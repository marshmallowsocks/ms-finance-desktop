import React from 'react';
import PropTypes from 'prop-types';
import {
  observer,
  inject
} from 'mobx-react';
import { Alert } from 'reactstrap';
import Title from '../Title';
import { 
  AccountCard,
  CreditCard,
  CryptoCard,
} from '../../Cards';
import helpers from '../../../util/helpers';

@inject('store')
@observer
class BankComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { accountStore } = this.props.store;
    const groupedAccounts = helpers.groupBy(accountStore.allAccounts, 'institutionName');
    const accounts = [];
    (Object.keys(groupedAccounts) || []).forEach((bank, idx) => {
      accounts.push(<h3>{bank}</h3>)
      groupedAccounts[bank].forEach(account => {
        switch(account.type) {
          case 'credit':
            accounts.push(<CreditCard 
              key={account.account_id}
              title={account.name}
              color={'danger'}
              subtitle={account.mask}
              officialName={account.official_name}
              balance={accountStore.cleanBalance(account.balances)}
              balances={account.balances}
            />);
            break;
          case 'crypto':
            accounts.push(<CryptoCard 
              key={idx}
              title={account.name}
              color={'success'}
              subtitle={account.mask}
              cryptoInformation={account.cryptoInformation}
              balance={accountStore.cleanBalance(account.balances)}
            />);
            break;
          default: 
            accounts.push(<AccountCard 
              key={account.account_id}
              title={account.name}
              color={account.type === 'credit' ? 'danger' : 'success'}
              subtitle={account.mask}
              officialName={account.official_name}
              balance={accountStore.cleanBalance(account.balances)}
            />);
            break;
        }
      }); 
      
    });
    return (
      <div>
        <Title
          title={this.props.title}
          hideBadge={true}
        />
        {
          accounts.length === 0 ? 
          <Alert color="info">Link an institution to get started.</Alert> :
          accounts
        }
      </div>
    );
  }
};

BankComponent.propTypes = {
  title: PropTypes.string.isRequired
};

export default BankComponent;