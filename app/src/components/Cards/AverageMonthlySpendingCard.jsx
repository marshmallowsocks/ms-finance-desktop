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
import { Line } from 'react-chartjs-2';

@inject('store')
@observer
class AverageMonthlySpendingCard extends React.Component {
  constructor(props) {
    super(props);

    this.getChartData = this.getChartData.bind(this);
  }

  getChartData() {
    const { transactionStore } = this.props.store;
    const transactions = [];
    let average = 0;

    for(let i = moment().startOf('year'); i.isBefore(moment()); i.add(1, 'month')) {
      transactions.push(transactionStore.getTransactionsAggregateForTimescale('month', i));
    }

    average = transactions.reduce((runningSum, t) => runningSum + t.debit - t.credit, 0)

    return {
      data: {
        datasets: [{
          label: 'Net Expenses',
          data: transactions.map(t => t.debit - t.credit),
          borderColor: 'rgba(255,99,132,1)',
        }],
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
        text: 'Net expenses per month'
      },
    };
    return (
      <Card>
        <div className={'card-img-top'}>
          <Line 
            data={data}
            options={options}
          />
        </div>
        <CardBody>
          <CardTitle>Monthly Expenses</CardTitle>
          <CardSubtitle className={'mb-2 text-muted'}>Your average expenses per month for {moment().get('year')}</CardSubtitle>
          <CardText>
              You've spent an average of <span className="font-weight-bold">${average}</span> per month this year.
              This number could be inflated by transfers between your own accounts.<br />
              Use the calendar section to know more!
          </CardText>
        </CardBody>
      </Card>
    )
  }
};

export default AverageMonthlySpendingCard;