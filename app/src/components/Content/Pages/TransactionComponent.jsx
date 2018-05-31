import React from 'react';
import {
  observer,
  inject
} from 'mobx-react';
import ReactTable from 'react-table';

import Title from '../Title';

@inject('store')
@observer
class TransactionComponent extends React.Component {
  constructor(props) {
    super(props);
  }
  
  getColumnDefinitions() {
    let currentType = 'greater';
    let currentValue = 0;
    return [
      {
        Header: 'Bank',
        columns: [
          {
            Header: 'Account',
            accessor: 'account',
            filterMethod: (filter, row) => 
              new RegExp(`.*${filter.value}.*`, 'gi').test(row[filter.id]),
          },
          {
            Header: 'Name',
            accessor: 'name',
            filterMethod: (filter, row) => 
              new RegExp(`.*${filter.value}.*`, 'gi').test(row[filter.id]),
          }
        ]
      },
      {
        Header: 'Transaction',
        columns: [
          {
            Header: 'Amount',
            accessor: 'amount',
            Cell: row => (
              <span className={row.value > 0 ? 'text-danger' : 'text-success'}>${Math.abs(row.value)}</span>
            ),
          },
          {
            Header: 'Date',
            accessor: 'date'
          },
        ],
      },
      {
        Header: 'Posted',
        accessor: 'pending',
        Cell: row => (
          <i className={row.value ? "fa fa-times" : "fa fa-check"}></i>
        ),
        filterMethod: (filter, row) => {
          if(filter.value === 'all') {
            return true;
          }
          
          if(filter.value === 'true') {
            return row[filter.id] === true;
          }

          return row[filter.id] === false;
        },
        Filter: ({ filter, onChange }) =>
          <select
            onChange={event => onChange(event.target.value)}
            style={{ width: "100%" }}
            value={filter ? filter.value : "all"}
          >
            <option value="all">All</option>
            <option value="true">Pending</option>
            <option value="false">Posted</option>
          </select>
      },
    ];
  }

  getData(transactions) {
    const data = [];
    transactions.forEach(transactionObject => {
      transactionObject.transactions.forEach(t => {
        data.push({
          account: transactionObject.accounts.filter(a => a.account_id === t.account_id)[0].name,
          name: t.name,
          amount: t.amount,
          date: t.date,
          pending: t.pending  
        });
      });
    });

    return data;
  }
  
  render() {
    const { transactionStore, uiStore } = this.props.store;
    return (
      <div>
      <Title 
        title={this.props.title}
        hideBadge={true}
      />
      <ReactTable
        filterable
        defaultPageSize={10}
        noDataText={uiStore.loading ? 'Loading transactions..' : 'No transactions found.'}
        style={{background: 'white', color: 'black'}}
        data={this.getData(transactionStore.transactions)}
        columns={this.getColumnDefinitions()}
      />
      </div>
    );
  }
}

export default TransactionComponent;