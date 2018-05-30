import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  CardText,
  Badge,
  Progress,
  Alert,
} from 'reactstrap';

import helpers from '../../util/helpers';
import styles from './styles.css';

class CreditCard extends React.Component {
  constructor(props) {
    super(props);
    this.calculateCreditUsage = this.calculateCreditUsage.bind(this);
  }

  calculateCreditUsage() {
    let credit = this.props.balances;
    let creditUsed = 'Could not calculate usage.';

    if(Number.isFinite(credit.limit) && Number.isFinite(credit.available) && credit.limit !== 0) {
      let creditAvailable = (credit.available/Math.ceil(credit.limit)) * 100;
      let usageBars;
      let fullBar;
      let alerts;
      let usedHeading = 'span';
      let availableHeading = 'span';

      creditUsed = ((Math.ceil(credit.limit) - credit.available)/Math.ceil(credit.limit)) * 100;
      creditUsed = helpers.round(creditUsed, 2);

      if(creditUsed < 8.5) {
        usedHeading = 'span';
        availableHeading = 'h3';
      }
      else if(creditUsed > 90) {
        usedHeading = 'h3';
        availableHeading = 'span';
      }
      else {
        usedHeading = 'h3';
        availableHeading = 'h3';
      }

      if(credit.used === 0) {
        usageBars = (
          <Progress striped value={creditAvailable} style={{height: '60px'}} color="success">
            <h3>${credit.available}</h3>
          </Progress>
        );
      }
      else {
        const used = (availableHeading === 'span' ? <span>${credit.available}</span>: <h3>${credit.available}</h3>);
        const available = (usedHeading === 'span' ? <span>${helpers.round(Math.ceil(credit.limit) - credit.available, 2)}</span>: <h3>${helpers.round(Math.ceil(credit.limit) - credit.available, 2)}</h3>);
        usageBars = (
          <Progress multi style={{height: '60px'}}>
            <Progress bar striped value={creditAvailable} style={{height: '60px'}} color="success">{used}</Progress>
            <Progress bar striped value={creditUsed} style={{height: '60px'}} color="danger">{available}</Progress>
          </Progress>
        );
      }
      fullBar = (
        <Progress value={100} style={{height: '60px'}}><h3>${credit.limit}</h3></Progress>
      );

      if(creditUsed > 30) {
        alerts = (
          <Alert color="danger" className={'mt-3'}>
            <i className="fa fa-warning"></i>{' '}
            Your usage ({creditUsed}%) is more than the worst case 30%. This will hurt your credit score.
          </Alert>
        );
      }
      else if(creditUsed === 30) {
        alerts = (
          <Alert color="danger" className={'mt-3'}>
            <i className="fa fa-warning"></i>{' '}
            Your usage ({creditUsed}%) is exactly the worst case 30%. Do not put any more purchases on this card.
          </Alert>
        );
      }
      else if(creditUsed > 10) {
        alerts = (
          <Alert color="warning" className={'mt-3'}>
            <i className="fa fa-warning"></i>{' '}
            Your usage ({creditUsed}%) is more than the recommended 10%. Try and pay some off to help usage!
          </Alert>
        );
      }
      else if(creditUsed === 10) {
        alerts = (
          <Alert color="info" className={'mt-3'}>
            <i className="fa fa-info"></i>{' '}
            Your usage ({creditUsed}%) is exactly the recommended 10%. Try not to put any more purchases on this card.
          </Alert>
        );
      }
      else {
        alerts = (
          <Alert color="info" className={'mt-3'}>
            <i className="fa fa-info"></i>{' '}
            Your usage ({creditUsed}%) is less than 10%. Good job!
          </Alert>
        );
      }

      return (
        <div>
          <span>Credit used: ${helpers.round(credit.limit - credit.available, 2)}/${credit.limit}</span>
          {usageBars}
          {fullBar}
          {alerts}
        </div>
      );
    }
    else {
      return (
        <div>
          <span>Credit limit: {Number.isFinite(credit.limit) ? `$${Math.ceil(credit.limit)}` : 'The institution did not provide this information.'}</span>
          <br />
          <span>Credit available: {Number.isFinite(credit.available) ? `$${credit.available}` : 'The institution did not provide this information.'}</span>
          <br />
          <span>Credit used: {creditUsed}</span>
        </div>
      );
    }
  }

  render() {
    return (
      <Card className={styles['basic-card']}>
        <CardBody>
          <CardTitle>
            {this.props.title} <Badge color={this.props.color} className={'float-right'}>${`(${this.props.balance})`}</Badge>
          </CardTitle>
          <CardSubtitle className={'mb-2 text-muted'}>{this.props.subtitle}</CardSubtitle>
          <div className="card-text">
            {this.props.officialName ? this.props.officialName : ''}
            <br/>
            {this.calculateCreditUsage()}
            {this.props.additionalInfo}
          </div>
        </CardBody>
      </Card>
    )
  }
}

CreditCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  color: PropTypes.oneOf([
    'success',
    'danger',
    'warning'
  ]),
  balance: PropTypes.number.isRequired,
  balances: PropTypes.shape({
    available: PropTypes.number,
    limit: PropTypes.number,
    current: PropTypes.number,
  }),
  officialName: PropTypes.string,
  additionalInfo: PropTypes.string,
};

export default CreditCard;