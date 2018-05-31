import React from 'react';
import {
  inject,
  observer
} from 'mobx-react';
import {
  Badge
} from 'reactstrap';
import moment from 'moment';
import ReactTable from 'react-table';
import BigCalendar from 'react-big-calendar';

import Title from '../Title';
import helpers from '../../../util/helpers';

BigCalendar.setLocalizer(BigCalendar.momentLocalizer(moment));

const TransactionForDate = ({ event }) => {
  event.data = {
    debit: helpers.round(event.data.debit, 2),
    credit: helpers.round(event.data.credit, 2),
  }
  return (
    <div>
      Spent: <Badge color={'danger'} className={'float-right'}>${event.data.debit}</Badge>
      <br />
      Received: <Badge color={'success'} className={'float-right'}>${event.data.credit}</Badge>
    </div>
  );
}

@inject('store')
@observer
class CalendarComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: '1970-01-01'
    };
    this.getData = this.getData.bind(this);
    this.showTransactions = this.showTransactions.bind(this);
    this.getEvents = this.getEvents.bind(this);
  }

  getEvents() {
    const events = [];
    const { transactionStore } = this.props.store;
    let ids = 0;

    for(let i = moment().startOf('month'); i.isBefore(moment().endOf('month')); i.add(1, 'day')) {
      const summary = transactionStore.getTransactionsAggregateForTimescale('date', i.format('YYYY-MM-DD'));
      events.push({
        id: ids++,
        data: summary,
        start: i.clone(),
        end: i.clone(),
        allDay: true
      });
    }
    return events;
  }

  showTransactions(event) { 
    this.setState({
      date: event.start.format('YYYY-MM-DD')
    });
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

  getData() {
    const data = [];
    const { transactionStore } = this.props.store;
    
    transactionStore.getTransactionsOnDate(this.state.date).forEach(t => {
      data.push({
        account: t.institutionName,
        name: t.name,
        amount: t.amount,
        date: t.date,
        pending: t.pending  
      });
    });

    return data;
  }

  render() {
    return (
      <div>
        <Title 
          title={this.props.title}
          hideBadge={true}
        />
        <ReactTable
          filterable
          noDataText={'Choose a date to see more.'}
          defaultPageSize={10}
          style={{background: 'white', color: 'black'}}
          data={this.getData()}
          columns={this.getColumnDefinitions()}
        />
        <div className={'mt-3'} style={{height:'600px', background: 'white', color: 'black'}}>
          <BigCalendar 
            events={this.getEvents()}
            views={['month']}
            toolbar={false}
            startAccessor={'start'}
            endAccessor={'end'}
            components={{
              event: TransactionForDate,
            }}
            onSelectEvent={e => this.showTransactions(e)}
          />
        </div>
      </div>
    )
  }
}

export default CalendarComponent;