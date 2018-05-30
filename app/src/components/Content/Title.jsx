import React from 'react';
import {
  Badge
} from 'reactstrap';
import PropTypes from 'prop-types';

import helpers from '../../util/helpers';

class Title extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <main role="main">
        <div className={"d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom"}>
          <h1 className="h2">{this.props.title}</h1>
          { this.props.hideBadge ? '' :
          <h2 className="mb-2 mb-md-0">
            <Badge color={this.props.color}>${helpers.round(this.props.contextBalance, 2)}</Badge>
          </h2>
          }
        </div>
      </main>
    );
  }
}

Title.propTypes = {
  title: PropTypes.string.isRequired,
  contextBalance: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isRequired,
  ]),
  hideBadge: PropTypes.bool,
};

export default Title;