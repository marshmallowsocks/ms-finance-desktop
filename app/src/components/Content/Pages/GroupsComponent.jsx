import React from 'react';
import {
  observer,
  inject
} from 'mobx-react';
import {
  Alert,
  Card,
  CardHeader,
  CardFooter,
  Badge,
  Button,
} from 'reactstrap';

import Title from '../Title';
import NetBalance from '../NetBalance';

@inject('store')
@observer
class GroupsComponent extends React.Component {
  constructor(props) {
    super(props);
    this.createGroups = this.createGroups.bind(this);
  }

  createGroups() {
    const markup = [];
    let groupMarkup = [];
    let groupTotal = 0;
    let groupTotalMarkup;
    
    const { accountStore } = this.props.store;

    if(accountStore.groups.length === 0) {
      return (<Alert color={'info'}>Create a group to get started!</Alert>);
    }
    
    console.log(accountStore.groups);

    accountStore.groups.forEach(group => {
      groupMarkup = [];
      groupTotal = 0;
      group.accounts.forEach(account => {
        let balance = accountStore.cleanBalance(account.balances);
        let contextClass;

        if(balance === -Infinity) {
          contextClass = 'danger';
          balance = 'ERROR';
        }
        else if(account.type !== 'credit') {
          groupTotal += balance;
          balance = `$${balance}`;
          contextClass = 'success';
        }
        else {
          groupTotal -= balance;
          balance = `$(${balance})`;
          contextClass = 'danger';
        }
        
        groupMarkup.push(
          <li key={account.account_id} className={"list-group-item"}>
            <h5>
              {account.name}
              <Badge color={contextClass} className={'float-right'}>{balance}</Badge>
            </h5>
          </li>
        );
      });

      markup.push(
        <Card key={group.id} className={'mt-3'}>
          <CardHeader>
            <h4>{group.name} <Button className="float-right" color={'danger'}>Delete group</Button></h4>
          </CardHeader>
          <ul className="list-group list-group-flush">
            {groupMarkup}
          </ul>
          <CardFooter>
            Group total: <NetBalance balance={groupTotal} />
          </CardFooter>
        </Card>
      );
    });

    return markup;
  }

  render() {
    return (
      <div>
        <Title 
          title={this.props.title}
          hideBadge={true}
        />
        {this.createGroups()}
      </div>
    )
  }
}

export default GroupsComponent;