import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { Switch } from 'react-router-dom';

import routes from '../../routes';

@withRouter
class Content extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate(prevProps) {
    // activeClassName is ridiculously buggy.
    // implent a custom active using mobx and react-router
    if(this.props.location.pathname === '/') {
      this.props.setActive('overview');
      return;
    }
    this.props.setActive(this.props.location.pathname.slice(1));
  }

  render() {
    return (
      <div className={"col-md-9 ml-sm-auto col-lg-10 px-4"} style={{marginBottom: '50px', paddingTop: '48px'}}>
        <Switch>
          {routes}
        </Switch>
      </div>
    );
  }
}

export default Content;