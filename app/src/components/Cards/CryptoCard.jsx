import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  CardText,
  Badge,
} from 'reactstrap';
import moment from 'moment';

import api from '../../api';
import helpers from '../../util/helpers';
import styles from './styles.css';

class CryptoCard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { lastUpdated, price } = this.props.cryptoInformation;
    return (
      <Card className={styles['basic-card']}>
        <CardBody>
          <CardTitle>
            {this.props.title} <Badge color={this.props.color} className={'float-right'}>${helpers.round(this.props.balance, 2)}</Badge>
          </CardTitle>
          <CardSubtitle className={'mb-2 text-muted'}>{this.props.subtitle}</CardSubtitle>
          <CardText>
            Price as of {moment.unix(lastUpdated).format('MMM Do YYYY HH:mm:ss')} : <span className="font-weight-bold">${price}</span>
            <br />
            Next update at {moment.unix(lastUpdated + 300).format('MMM Do YYYY HH:mm:ss')}.
          </CardText>
        </CardBody>
      </Card>
    )
  }
}

CryptoCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  color: PropTypes.oneOf([
    'success',
    'danger',
    'warning'
  ]),
  balance: PropTypes.number.isRequired,
  additionalInfo: PropTypes.string,
};

export default CryptoCard;