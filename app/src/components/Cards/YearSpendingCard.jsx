import React from 'react';
import {
  observer,
  inject
} from 'mobx-react';
import {
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  CardText,
} from 'reactstrap';
import moment from 'moment';
import { Bar } from 'react-chartjs-2';

@inject('store')
@observer
class YearSpendingCard extends React.Component {
  constructor(props) {
    super(props);

    this.getChartData = this.getChartData.bind(this);
  }

  getChartData() {
    const { transactionStore } = this.props.store;
    const transactions = [];
    let average = 0;

    for(let i = moment().startOf('year'); i.isBefore(moment().add(1, 'month')); i.add(1, 'month')) {
      transactions.push(transactionStore.getTransactionsAggregateForTimescale('month', i));
    }

    average = transactions.reduce((runningSum, t) => runningSum - t.debit + t.credit, 0)

    return {
      data: {
        datasets: [
          {
            label: 'Expense',
            backgroundColor: 'rgba(255,99,132,1)',
            data: transactions.map(t => t.debit)
          },
          {
            label: 'Income',
            backgroundColor: 'rgba(75, 192, 192, 1)',
            data: transactions.map(t => t.credit)
          }
        ],
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      },
      average 
    };
  }

  render() {
    const { data, average } = this.getChartData();
    const options = {
      legend: { display: false },
      title: {
        display: true,
        text: 'Net Expense/Income'
      },
    };
    return (
      <Card>
        <div className={'card-img-top'}>
          <Bar
            data={data}
            options={options}
          />
        </div>
        <CardBody>
          <CardTitle>Income and Expenses</CardTitle>
          <CardSubtitle className={'mb-2 text-muted'}>Your net savings/expenses per month for {moment().get('year')}</CardSubtitle>
          <CardText>
            Data may be inflated by transfers between your own accounts. <br />
            Check the <span className="font-weight-bold">Transfer</span> category under Transaction Breakdown to verify.
          </CardText>
        </CardBody>
      </Card>
    )
  }
};

export default YearSpendingCard;