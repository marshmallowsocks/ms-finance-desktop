import React from 'react';
import styles from './styles.css';
import {
  Container,
  Row,
  Col,
} from 'reactstrap';
import {
  observer,
  inject
} from 'mobx-react';

import Loader from '../Loader';

@inject('store')
@observer
class Footer extends React.Component {
  constructor(props) {
    super(props);
  }

  createMarkup(__html) {
    return { __html };  
  }

  render() {
    return (
      <footer className={styles.footer}>
        <Container fluid>
          <Row>
            <Col md={5} lg={6}>
              <span className="float-left">Made with anxiety by Marshmallowsocks.</span>
            </Col>
            <Col md={3} lg={3}>
              <div className={'mt-3'}>
                <Loader loading={this.props.store.uiStore.loading} />
              </div>
            </Col>
            <Col md={4} lg={3}>
              <span
                className="float-right"
                style={{color: '#ccc'}}
                dangerouslySetInnerHTML={this.createMarkup(this.props.store.uiStore.latestMessage)}
              />
            </Col>
          </Row>
        </Container>
      </footer>
      
    );
  }
}

export default Footer;