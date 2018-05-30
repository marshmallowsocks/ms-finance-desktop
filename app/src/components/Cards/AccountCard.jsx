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

import styles from './styles.css';

// Can also be used as InvestmentCard, BankCard, CryptoCard

class AccountCard extends React.Component {
  constructor(props) {
    super(props);
  }

  createAdditionalInfo(html) {
    return {
      __html: html
    };
  }
  render() {
    return (
      <Card className={styles['basic-card']}>
        <CardBody>
          <CardTitle>
            {this.props.title} <Badge color={this.props.color} className={'float-right'}>${this.props.balance}</Badge>
          </CardTitle>
          <CardSubtitle className={'mb-2 text-muted'}>{this.props.subtitle}</CardSubtitle>
          <CardText>
            {this.props.officialName ? this.props.officialName : ''}
            <br/>
            <span dangerouslySetInnerHTML={this.createAdditionalInfo(this.props.additionalInfo)}></span>
          </CardText>          
        </CardBody>
      </Card>
    )
  }
}

AccountCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  color: PropTypes.oneOf([
    'success',
    'danger',
    'warning'
  ]),
  balance: PropTypes.number.isRequired,
  officialName: PropTypes.string,
  additionalInfo: PropTypes.string,
};

export default AccountCard;