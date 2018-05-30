import React from 'react';
import PropTypes from 'prop-types';
import {
  observer,
  inject
} from 'mobx-react';
import { Alert } from 'reactstrap';
import Title from '../Title';
import { CreditCard } from '../../Cards';

@inject('store')
@observer
class CreditComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { accountStore } = this.props.store;
    const accounts = (accountStore.accounts['credit'] || []).map(account => {
      return <CreditCard 
        key={account.account_id}
        title={account.name}
        color={'danger'}
        subtitle={account.mask}
        officialName={account.official_name}
        balance={accountStore.cleanBalance(account.balances)}
        balances={account.balances}
      />;
    });
    return (
      <div>
        <Title
          title={this.props.title}
          color={'danger'}
          contextBalance={accountStore.creditDebt}
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

CreditComponent.propTypes = {
  title: PropTypes.string.isRequired
};

export default CreditComponent;