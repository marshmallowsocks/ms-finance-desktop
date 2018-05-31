import React from 'react';
import { Container } from 'reactstrap';
import { RingLoader } from 'react-spinners';

export default class Splash extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="h-100">
        <Container className="h-100">
        <div className="d-flex align-items-center justify-content-center h-100">
          <div className="d-flex flex-column">
            <h1 className="display-3 mt-4 align-self-center">
              Marshmallowsocks Finance
            </h1>
            <div className="align-self-center p-2">
              <RingLoader size={250} color={'#ccc'}/>
            </div>
          </div>
        </div>
        </Container>
      </div>
      
    );
  }
}