import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  CardText,
} from 'reactstrap';

import styles from './styles.css';

class BasicCard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Card className={styles['basic-card']}>
        <CardBody>
          <CardTitle>{this.props.title}</CardTitle>
          <CardSubtitle>{this.props.subtitle}</CardSubtitle>
          <CardText>
            {this.props.info}
          </CardText>
        </CardBody>
      </Card>
    );
  }
}

BasicCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  info: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
};

export default BasicCard;