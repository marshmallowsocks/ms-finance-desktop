import React from 'react';
import PropTypes from 'prop-types';
import {
  inject,
  observer
} from 'mobx-react';
import {
  Row,
  Col,
  ButtonGroup,
  Button,
} from 'reactstrap';
import ReactTable from 'react-table';
import { Doughnut } from 'react-chartjs-2';

import constants from '../../../constants';
import helpers from '../../../util/helpers';
import Title from '../Title';

@inject('store')
@observer
class TransactionBreakdownComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedGranularity: 'thisWeek',
      selectedTransactions: []
    };
    
    this.changeGranularity = this.changeGranularity.bind(this);
    this.getTableData = this.getTableData.bind(this);
    this.getChartData = this.getChartData.bind(this);
    this.onChartClick = this.onChartClick.bind(this);
  }

  changeGranularity(selectedGranularity) {
    this.setState({
      selectedGranularity
    });
  }

  getTableData() {
    const data = [];
    const { transactionStore } = this.props.store;

    if(!this.state.selectedTransactions.length) {
      return data;
    }
    transactionStore.transactions.forEach(transactionObject => {
      transactionObject.transactions.forEach(t => {
        let include = helpers.isInDateRange(t.date, this.state.selectedGranularity);
        if(include && this.state.selectedTransactions.find(tr => tr.transaction_id === t.transaction_id)) {
          data.push({
            account: transactionObject.accounts.filter(a => a.account_id === t.account_id)[0].name,
            name: t.name,
            amount: t.amount,
            date: t.date,
            pending: t.pending  
          });
        }
      });
    });

    return data;
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
            filterMethod: (filter, row) => {
              if(filter.value.type === 'type') {
                currentType = filter.value.data;
              }
              else {
                if(currentValue === '') {
                  currentValue = 0;
                }
                currentValue = parseInt(filter.value.data, 10);
              }

              switch(currentType) {
                case 'greater':
                  return row[filter.id] > currentValue;
                case 'less':
                  return row[filter.id] < currentValue;
                case 'equal':
                  return row[filter.id] == currentValue;
              }
            },
            Filter: ({filter, onChange}) => (
              <div>
              <select
                onChange={event => onChange({data: event.target.value, type: 'type'})}
                style={{ width: "30%" }}
                value={filter ? filter.value.type : "greater"}
              >
                <option value="greater">&gt;</option>
                <option value="less">&lt;</option>
                <option value="equal">=</option>
              </select>
              <input type="number" style={{width: '70%'}} value={0} onChange={event => onChange({data: event.target.value, type: 'number'})}/>
              </div>
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

  getChartData() {
    const { transactionStore } = this.props.store;
    const groupedTransactions = helpers.groupBy(transactionStore.allTransactions, 'mainCategory');
    const transactionDataset = [];
    const transactionDataLabels = [];
    let colors = constants.colors;

    Object.keys(groupedTransactions)
          .forEach(key => {
            let total = 0;
            if(key === 'undefined') {
              transactionDataLabels.push('Uncategorized');  
            }
            else {
              transactionDataLabels.push(key);
            }
            groupedTransactions[key].forEach(transaction => {
              if(helpers.isInDateRange(transaction.date, this.state.selectedGranularity)) {
                total += transaction.amount;
              }
            });
  
            transactionDataset.push(Math.abs(total));
          });
    
    while(colors.length < transactionDataLabels.length) {
      colors = [...colors, ...colors];
    }
    while(colors.length !== transactionDataLabels.length) {
      colors.pop();
    }
    if(colors[0] === colors[colors.length - 1]) {
      const temp = colors[length - 2];
      colors[length - 2] = colors[length - 1];
      colors[length - 1] = temp; 
    }
    
    return {
      datasets: [{
        data: transactionDataset,
        backgroundColor: colors, 
      }],
      labels: transactionDataLabels,
    };
  }

  onChartClick(dataset) {
    const key = dataset[0]._model.label === 'Uncategorized' ? 'undefined' : dataset[0]._model.label;
    const { transactionStore } = this.props.store;
    const groupedTransactions = helpers.groupBy(transactionStore.allTransactions, 'mainCategory');
    const selectedTransactions = groupedTransactions[key].filter(transaction => {
      return helpers.isInDateRange(transaction.date, this.state.selectedGranularity);
    });

    this.setState({
      selectedTransactions
    });
  }

  render() {
    const { transactionStore, uiStore } = this.props.store;
    return (
      <div>
        <Title 
          title={this.props.title}
          hideBadge={true}
        />
        <div className="d-flex align-items-center justify-content-center h-100">
          <div className="d-flex flex-column">
            <ButtonGroup className={'align-self-center'}>
              <Button onClick={() => this.changeGranularity('thisWeek')} color={this.state.selectedGranularity === 'thisWeek' ? 'primary' : ''}>This Week</Button>
              <Button onClick={() => this.changeGranularity('thisMonth')} color={this.state.selectedGranularity === 'thisMonth' ? 'primary' : ''}>This Month</Button>
              <Button onClick={() => this.changeGranularity('lastMonth')} color={this.state.selectedGranularity === 'lastMonth' ? 'primary' : ''}>Last Month</Button>
              <Button onClick={() => this.changeGranularity('thisYear')} color={this.state.selectedGranularity === 'thisYear' ? 'primary' : ''}>This Year</Button>
            </ButtonGroup>
          </div>
        </div>
        <Row className={'mt-3'}>
          <Col sm={12} md={6} lg={6}>
            <Doughnut
              width={500}
              height={500}
              options={{
                maintainAspectRatio: false
              }}
              data={this.getChartData()}
              onElementsClick={this.onChartClick}
            />
          </Col>
          <Col sm={12} md={6} lg={6}>
          <ReactTable
            filterable
            noDataText={uiStore.loading ? 'Loading transactions..' : 'Click a category to get started.'}
            style={{background: 'white', color: 'black'}}
            data={this.getTableData()}
            columns={this.getColumnDefinitions()}
            defaultPageSize={10}
          />
          </Col>
        </Row>
      </div>
    );
  }
}

TransactionBreakdownComponent.propTypes = {
  title: PropTypes.string.isRequired,
};

export default TransactionBreakdownComponent;