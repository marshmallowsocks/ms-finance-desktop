import React from 'react';
import { Route } from 'react-router-dom';
import {
  Overview,
  Account,
  Credit,
  Investment,
  Bank,
  Crypto,
  Transactions,
  Breakdown,
  Groups,
  Calendar,
} from '../components/Content/Pages';

const routes = [
  <Route key='/overview' path='/overview' exact render={(props) => <Overview {...props} title='Overview' /> }/>,
  <Route key='/accounts' path='/accounts' exact render={(props) => <Account {...props} title='Accounts' /> }/>,
  <Route key='/credit' path='/credit' exact render={(props) => <Credit {...props} title='Credit Cards' /> }/>,
  <Route key='/investments' path='/investments' exact render={(props) => <Investment {...props} title='Investments' /> }/>,
  <Route key='/banks' path='/banks' exact render={(props) => <Bank {...props} title='Banks' /> }/>,
  <Route key='/crypto' path='/crypto' exact render={(props) => <Crypto {...props} title='Cryptocurrency' /> }/>,
  <Route key='/transactions' path='/transactions' exact render={(props) => <Transactions {...props} title='Transactions' /> }/>,
  <Route key='/calendar' path='/calendar' exact render={(props) => <Calendar {...props} title='Calendar' /> }/>,
  <Route key='/chart' path='/chart' exact render={(props) =><Breakdown {...props} title='Transaction Breakdown' /> }/>,
  <Route key='/groups' path='/groups' exact render={(props) => <Groups {...props} title='Groups' /> }/>,
  <Route key='/default' render={(props) => <Overview {...props} title='Overview' /> }/>,
];

export default routes;