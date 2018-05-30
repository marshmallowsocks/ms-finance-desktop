import React from 'react';
import {
  inject,
  observer
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
import { transaction } from 'mobx';

import styles from './styles.css';

@inject('store')
@observer
class MonthPerformanceCard extends React.Component {
  constructor(props) {
    super(props);
    this.getChartData = this.getChartData.bind(this);
  }

  getChartData() {
    const { transactionStore } = this.props.store;
    const performance = {
      lastMonth: [],
      thisMonth: [],
    };
    const performanceLabels = [];
    
    for(let i = 1; i <= moment().subtract(1, 'month').startOf('month').daysInMonth(); i++) {
      performance.lastMonth.push(
        transactionStore.getTransactionsAggregateForTimescale('date',
          moment([moment().year(), moment().subtract(1, 'month').month(), i]).format('YYYY-MM-DD')
        )
      );
    }
  
    for(let i = 1; i <= moment().startOf('month').daysInMonth(); i++) {
      performance.thisMonth.push(
        transactionStore.getTransactionsAggregateForTimescale('date',
          moment([moment().year(), moment().month(), i]).format('YYYY-MM-DD')
        )
      );
    }

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    
    for(let i = 1; i <= 31; i++) {
      performanceLabels.push(i);
    }

    return {
      labels: performanceLabels,
      datasets: [{
        label: moment().format('MMMM'),
        data: performance.thisMonth.map(t => {
          thisMonthTotal += t.debit;
          return thisMonthTotal;
        }),
        borderColor: 'rgba(255,99,132,1)',
      },
      {
        label: moment().subtract(1, 'month').format('MMMM'),
        data: performance.lastMonth.map(t => {
          lastMonthTotal += t.debit;
          return lastMonthTotal;
        }),
        borderColor: 'rgba(75, 192, 192, 1)',
      }],
    };
  }
  
  render() {
    const data = this.getChartData();
    const options = {
      legend: { display: false },
      title: {
        display: true,
        text: 'Spending Differential'
      }
    };
    return (
      <Card className={'mt-1'}>
        <div className={'card-img-top'}>
          <Line
            data={data}
            options={options}
          />
        </div>
        <CardBody>
          <CardTitle>Spending differential</CardTitle>
          <CardSubtitle className={'mb-2 text-muted'}>Your performance against one month ago.</CardSubtitle>
          <CardText>
            This compares your spending vs the same time last month. <br />
          </CardText>
        </CardBody>
      </Card>
    );
  }
}

export default MonthPerformanceCard;