import React from 'react';
import PropTypes from 'prop-types';
import { PropagateLoader } from 'react-spinners';

class Loader extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <PropagateLoader 
        loading={this.props.loading}
        color={'#ccc'}
      />
    );
  }
}

Loader.propTypes = {
  loading: PropTypes.bool
};

export default Loader;

