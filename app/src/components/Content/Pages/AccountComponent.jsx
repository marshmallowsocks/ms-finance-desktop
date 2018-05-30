import React from 'react';
import PropTypes from 'prop-types';
import {
  observer,
  inject
} from 'mobx-react';
import { Alert } from 'reactstrap';
import Title from '../Title';
import { AccountCard } from '../../Cards';

@inject('store')
@observer
class AccountComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { accountStore } = this.props.store;
    const accounts = (accountStore.accounts['depository'] || []).map(account => {
      return <AccountCard 
        key={account.account_id}
        title={account.name}
        color={'success'}
        subtitle={account.mask}
        officialName={account.official_name}
        balance={accountStore.cleanBalance(account.balances)}
      />;
    });
    return (
      <div>
        <Title
          title={this.props.title}
          color={'success'}
          contextBalance={accountStore.cashBalance}
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

AccountComponent.propTypes = {
  title: PropTypes.string.isRequired
};

export default AccountComponent;