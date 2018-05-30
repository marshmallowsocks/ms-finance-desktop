import React from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Row,
  Col,
} from 'reactstrap';

import Title from '../Title';
import {
  AverageMonthlySpendingCard,
  YearSpendingCard,
  WeekSpendingCard,
  MonthPerformanceCard,
} from '../../Cards';

class OverviewComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Title 
          title={this.props.title}
          hideBadge={true}
        />
        <Row>
          <Col md={6} lg={6} sm={12} xs={12}>
            <AverageMonthlySpendingCard />
            <WeekSpendingCard />
          </Col>
          <Col md={6} lg={6} sm={12} xs={12}>
            <YearSpendingCard />
            <MonthPerformanceCard />
          </Col>
        </Row>
        
      </div>
    );
  }
};

OverviewComponent.propTypes = {
  title: PropTypes.string.isRequired
};

export default OverviewComponent;