import React from 'react';
import PropTypes from 'prop-types';
import helpers from '../../util/helpers';

class NetBalance extends React.Component {
  constructor(props) {
    super(props);
    this.getBalanceMarkup = this.getBalanceMarkup.bind(this);
  }

  getBalanceMarkup() {
    const markup = {
      classStyle: '',
      balance: 0
    };

    let balance = this.props.balance;
  
    if(balance === '-') {
      markup.classStyle = 'text-success font-weight-bold';
      markup.balance = '$-';
    }
    else if(balance < 0) {
      markup.classStyle = 'text-danger font-weight-bold';
      balance = helpers.round(balance, 2);
      markup.balance = '$(' + (-1 * balance) + ')'; 
    }
    else {
      markup.classStyle = 'text-success font-weight-bold';
      balance = helpers.round(balance, 2);
      markup.balance = '$' + balance;
    }
  
    return markup;
  }

  render() {
    const markup = this.getBalanceMarkup();
    return (
      <span className={`${markup.classStyle} float-right`}>
        {markup.balance}
      </span>
    )
  }
}

NetBalance.propTypes = {
  balance: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isRequired
  ]),
};

export default NetBalance;