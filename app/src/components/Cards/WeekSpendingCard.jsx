import React from 'react';
import {
  inject,
  observer
} from 'mobx-react';
import moment from 'moment';
import BasicCard from './BasicCard';
import helpers from '../../util/helpers';

@inject('store')
@observer
class WeekSpendingCard extends React.Component {
  constructor(props) {
    super(props);
    this.getWeekTransactions = this.getWeekTransactions.bind(this);
  }

  getWeekTransactions() {
    const { transactionStore } = this.props.store;
    const summary = transactionStore.getTransactionsAggregateForTimescale('week', moment());
    return (
      <span>
        You've spent <span className="font-weight-bold text-danger">${helpers.round(summary.debit, 2)}</span> recently.<br />
        Use the transaction breakdown section to know more!
      </span>
    );
  }

  render() {
    return (
      <BasicCard
        title={'This Week'}
        subtitle={'Have you been overspending?'}
        info={this.getWeekTransactions()}
      />
    );
  }
}

export default WeekSpendingCard;