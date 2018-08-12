import React from 'react';
import { remote } from 'electron';
import {
  Navbar,
  Nav,
  NavItem,
  NavLink,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Input,
  Label,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
  CardTitle,
  CardText,
  Table,
} from 'reactstrap';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-bootstrap-typeahead/css/Typeahead-bs4.css';
import { Typeahead } from 'react-bootstrap-typeahead';
import {
  observer,
  inject
} from 'mobx-react';

import { NavLink as RRNavLink } from 'react-router-dom';

import PlaidLink from '../PlaidLink';
import api from '../../api';
import constants from '../../constants';
import helpers from '../../util/helpers';
import styles from './styles.css';

@inject('store')
@observer
class SideBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      groupModal: false,
      synchronizeModal: false,
      activeToken: null,
    };

    this.fileInput = React.createRef();
    this.plaidLink = React.createRef();
    this.toggle = this.toggle.bind(this);
    this.synchronize = this.synchronize.bind(this);
    this.toggleSynchronize = this.toggleSynchronize.bind(this);
    this.toggleCreateGroup = this.toggleCreateGroup.bind(this);
    this.databaseImport = this.databaseImport.bind(this);
    this.importDatabase = this.importDatabase.bind(this);
    this.exportDatabase = this.exportDatabase.bind(this);
    this.handlePlaidExit = this.handlePlaidExit.bind(this);
    this.handlePlaidSuccess = this.handlePlaidSuccess.bind(this);
    this.handlePlaidRefresh = this.handlePlaidRefresh.bind(this);
  }

  handlePlaidExit() {
    const { uiStore } = this.props.store;
    uiStore.addMessage('Bank linking aborted.');
  }

  async handlePlaidSuccess(token) {
    const { accountStore, uiStore, transactionStore } = this.props.store;
    uiStore.toggleLoader(true);
    try {
      const result = await api.exchangePublicToken(token);
      if(!result.error) {
        const { name, itemId } = await api.fetchLatestInstitutionData();
        const data = [];
        
        data.push(await api.fetchAccountData(itemId));
        data.push(await api.fetchTransactionData(itemId));
        
        accountStore.addAccount(data[0].data);
        
        transactionStore.addAllTransactions([
          ...data.filter(r => r.type === 'transactions').map(r => r.data)
        ]);
        
        uiStore.addMessage(`${name} linked successfully.`);
      }
    }
    catch(e) {
      uiStore.addMessage('Failed to link bank account.');
      throw Error(e);
    }
    uiStore.toggleLoader(false);
  }

  async handlePlaidRefresh(account) {
    const { 
      accountStore,
      uiStore,
      domainStore,
      transactionStore,
    } = this.props.store;
    uiStore.toggleLoader(true);
    const { name, itemId } = account;
    try {
      const data = [];

      data.push(await api.fetchAccountData(itemId));
      data.push(await api.fetchTransactionData(itemId));

      accountStore.addAccount(data[0].data);
      transactionStore.addAllTransactions([
        ...data.filter(r => r.type === 'transactions').map(r => r.data)
      ]);

      uiStore.addMessage(`${name} refreshed successfully.`);
      domainStore.resetAccounts = domainStore.resetAccounts.filter(resetAccount => resetAccount.itemId !== itemId);
    }
    catch(e) {
      uiStore.addMessage(`Could not sync ${name}.`);
    }
    uiStore.toggleLoader(false);
  }

  databaseImport() {
    this.fileInput.current.click();
  }

  importDatabase(e) {
    e.preventDefault();
    const { uiStore } = this.props.store;
    if(e.target.files.length === 0) {
      uiStore.addMessage('No file selected.');
    }
    else {
      const reader = new FileReader();
      reader.readAsText(e.target.files[0]);
      reader.onload = event => {
        const jsonString = event.target.result;
        api.importDatabase(jsonString).then(res => {
          if(!res.error) {
            remote.app.relaunch();
            remote.app.exit(0);
          }
          else {
            uiStore.addMessage('Could not import database.');
          }
        });
      }
      reader.onerror = event => {
        uiStore.addMessage('Failed to import database.');
      }
    }
  }

  async exportDatabase(e) {
    e.preventDefault();
    const { uiStore } = this.props.store;
    uiStore.toggleLoader(true);
    uiStore.addMessage('Exporting database to exportedDB.json...');
    const result = await api.exportDatabase();
    
    if(result.error) {
      uiStore.addMessage('Export failed.');
    }

    else {
      uiStore.addMessage('Export successful.');
    }

    uiStore.toggleLoader(false);
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }

  toggleCreateGroup() {
    this.setState({
      groupModal: !this.state.groupModal
    });
  }

  componentDidMount() {
    const { uiStore, domainStore } = this.props.store;
    if(!domainStore.plaidAvailable) {
      uiStore.addMessage('Plaid is unavailable.');
    }
    uiStore.toggleLoader(false);
  }

  toggleSynchronize() {
    const { uiStore, domainStore } = this.props.store;
    if(!domainStore.resetAccounts.length) {
      uiStore.addMessage('All accounts are up to date.');
      this.setState({
        synchronizeModal: false
      });
      return;
    }

    this.setState({
      synchronizeModal: !this.state.synchronizeModal
    });
  }

  async synchronize(account) {
    const { uiStore, domainStore } = this.props.store;
    const tokenResponse = await api.resetCredentialsForToken(account.token);
    const linkHandler = window.Plaid.create({
      apiVersion: 'v2',
      clientName: 'Marshmallowsocks Finance',
      env: constants.plaid.PLAID_ENV,
      key: domainStore.plaidCredentials.public_key,
      onExit: console.log,
      onSuccess: () => this.handlePlaidRefresh(account),
      product: ['transactions'],
      token: tokenResponse.public_token,
    });

    linkHandler.open();
  }

  render() {
    const { uiStore, accountStore, domainStore } = this.props.store;
    let netBalanceMarkup;
    
    if(accountStore.netBalance < 0) {
      netBalanceMarkup = {
        balance: `$(${accountStore.netBalance})`,
        className: 'text-danger',
      };
    }
    else {
      netBalanceMarkup = {
        balance: `$${helpers.round(accountStore.netBalance, 2)}`,
        className: 'text-success',
      };
    }
    return (
      <div>
      <Navbar className={`col-md-2 d-none d-md-block bg-light ${styles.sidebar}`}>
        <div className={`${styles['sidebar-sticky']}`}>
          <Nav className={"flex-column"}>
            <NavItem>
              <Card style={{border: 'none'}}>
                <CardBody>
                  <CardTitle>Net Worth</CardTitle>
                  <CardText style={{fontSize: '32px'}} className={netBalanceMarkup.className}>{netBalanceMarkup.balance}</CardText>
                </CardBody>
              </Card>
            </NavItem>
            <NavItem>
              <NavLink tag={RRNavLink} className={`${styles['nav-link']} ${uiStore.activePath === 'overview' ? styles['active'] : ''}`} to='/overview'>
                <i className={`fa fa-home ${styles['fa']}`}></i>
                Overview
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink tag={RRNavLink} className={`${styles['nav-link']} ${uiStore.activePath === 'accounts' ? styles['active'] : ''}`} to='/accounts'>
                <i className={`fa fa-usd ${styles['fa']}`}></i>
                Accounts
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink tag={RRNavLink} className={`${styles['nav-link']} ${uiStore.activePath === 'credit' ? styles['active'] : ''}`} to='/credit'>
                <i className={`fa fa-credit-card ${styles['fa']}`}></i>
                Credit Cards
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink tag={RRNavLink} className={`${styles['nav-link']} ${uiStore.activePath === 'investments' ? styles['active'] : ''}`} to='/investments'>
                <i className={`fa fa-line-chart ${styles['fa']}`}></i>
                Investments
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink tag={RRNavLink} className={`${styles['nav-link']} ${uiStore.activePath === 'banks' ? styles['active'] : ''}`} to='/banks'>
                <i className={`fa fa-university ${styles['fa']}`}></i>
                Banks
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink tag={RRNavLink} className={`${styles['nav-link']} ${uiStore.activePath === 'crypto' ? styles['active'] : ''}`} to='/crypto'>
                <i className={`fa fa-bitcoin ${styles['fa']}`}></i>
                Cryptocurrency
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink tag={RRNavLink} className={`${styles['nav-link']} ${uiStore.activePath === 'transactions' ? styles['active'] : ''}`} to='/transactions'>
                <i className={`fa fa-table ${styles['fa']}`}></i>
                Transactions
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink tag={RRNavLink} className={`${styles['nav-link']} ${uiStore.activePath === 'groups' ? styles['active'] : ''}`} to='/groups'>
                <i className={`fa fa-object-group ${styles['fa']}`}></i>
                Groups
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink disabled={uiStore.loading} tag={RRNavLink} className={`${styles['nav-link']} ${uiStore.activePath === 'chart' ? styles['active'] : ''}`} to='/chart'>
                <i className={`fa fa-pie-chart ${styles['fa']}`}></i>
                Transaction Breakdown
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink tag={RRNavLink} className={`${styles['nav-link']} ${uiStore.activePath === 'calendar' ? styles['active'] : ''}`} to='/calendar'>
                <i className={`fa fa-calendar ${styles['fa']}`}></i>
                Calendar
              </NavLink>
            </NavItem>
            <NavItem style={{position: 'absolute', bottom: '40px'}} className={'nav-link'}>
            <UncontrolledDropdown>
              <DropdownToggle tag='div'>
                <Button color='success' outline size={'lg'}>
                  <i className={'fa fa-gear'}></i> Settings
                </Button>
              </DropdownToggle>
              <DropdownMenu>
              {domainStore.plaidAvailable ?
              <PlaidLink
                clientName="Marshmallowsocks Finance"
                env="sandbox"
                product={["transactions"]}
                publicKey={domainStore.plaidCredentials.public_key}
                onExit={this.handlePlaidExit}
                onSuccess={this.handlePlaidSuccess}
              >
                Add Bank
              </PlaidLink>
              : '' 
              }
              <DropdownItem onClick={this.toggle}>
                Add Crypto
              </DropdownItem>
              <DropdownItem onClick={this.toggleCreateGroup}>
                Add Group
              </DropdownItem>
              <DropdownItem divider />
              <DropdownItem onClick={this.databaseImport}>
                Import Database
                <input
                  type="file"
                  style={{display: 'none'}}
                  accept=".json"
                  ref={this.fileInput}
                  onChange={e => this.importDatabase(e)}
                />
              </DropdownItem>
              <DropdownItem onClick={this.exportDatabase}>
                Export Database
              </DropdownItem>
              <DropdownItem divider />
              <DropdownItem onClick={this.toggleSynchronize}>
                Synchronize
              </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
            </NavItem>
          </Nav>
        </div>
      </Navbar>
      <CredentialsModal 
        isOpen={!domainStore.plaidAvailable}
        databaseImport={this.databaseImport} />
      <CryptoModal 
        isOpen={this.state.modal}
        toggleModal={this.toggle} />
      <CreateGroupModal 
        isOpen={this.state.groupModal}
        toggleModal={this.toggleCreateGroup} />
      <SynchronizeAccountModal 
        isOpen={this.state.synchronizeModal}
        toggleModal={this.toggleSynchronize}
        synchronize={this.synchronize} />
      </div>
    );
  }
}

@inject('store')
@observer
class CryptoModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      symbol: '',
      holdings: 0
    };

    this.saveHoldings = this.saveHoldings.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.cryptoSelected = this.cryptoSelected.bind(this);
  }

  cryptoSelected(symbol) {
    this.setState({
      symbol: symbol[0]
    });
  }

  handleChange(event) {
    let key;
    switch(event.target.id) {
      case 'cryptoSymbol':
        key = 'symbol';
        break;
      case 'cryptoHoldings':
        key = 'holdings';
        break;
    }

    this.setState({
      [key]: event.target.value
    });
  }

  saveHoldings() {
    const { uiStore, accountStore } = this.props.store;
    const { symbol, holdings } = this.state;
    const crypto = accountStore.getCryptoInformation(symbol);
    uiStore.toggleLoader(true);
    if(isNaN(parseInt(holdings, 10))) {
      holdings = 0;
    }
  
    api.saveCryptoHolding({
      crypto_id: crypto.id,
      name: crypto.name,
      symbol,
      holdings,
    }).then(res => {
      if(!res.exists) {
        accountStore.addAccount(accountStore.createAccountObject(crypto, holdings));
        uiStore.addMessage(`${crypto.name} added successfully.`);
        uiStore.toggleLoader(false);
      }
    });
    this.props.toggleModal();
  }

  render() {
    const { accountStore } = this.props.store;
    return (
    <Modal isOpen={this.props.isOpen}>
        <ModalHeader>Add Cryptocurrency holdings</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="cryptoSymbol">Symbol</Label>
              <Typeahead id="cryptoSymbol" onChange={this.cryptoSelected} options={accountStore.allCrypto.map(c => c.symbol)} />
            </FormGroup>
            <FormGroup>
              <Label for="cryptoHoldings">Holdings</Label>
              <Input type="number" id="cryptoHoldings" value={this.state.holdings} onChange={this.handleChange} />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="success" onClick={this.saveHoldings}>Add holdings</Button>{' '}
          <Button color="danger" onClick={this.props.toggleModal}>Cancel</Button>
        </ModalFooter>
    </Modal>);
  }
}

@inject('store')
@observer
class CreateGroupModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      selected: [],
    };

    this.handleChange = this.handleChange.bind(this);
    this.saveGroup = this.saveGroup.bind(this);
  }

  handleChange(event) {
    if(event.target.id === 'groupName') {
      this.setState({
        name: event.target.value
      });
    }

    else {
      const selected = this.state.selected;
      const value = event.target.value;
      
      if(event.target.checked) {
        selected.push(event.target.value);
        this.setState({
          selected
        });
      }
      else {
        const index = selected.indexOf(value);
        selected.splice(index, 1);
        this.setState({
          selected
        });
      }
    }
  }

  async saveGroup() {
    const { uiStore, accountStore } = this.props.store;
    const name = this.state.name;
    const accounts = this.state.selected;

    uiStore.toggleLoader(true);
    const result = await api.createGroup(name, accounts);
    if(result.error) {
      uiStore.addMessage('An error occurred while creating the group.');
    }
    else {
      accountStore.addGroup({
        name,
        accounts,
        id: result.id,
      });
      uiStore.addMessage('Group created!');
    }
    this.props.toggleModal();
    uiStore.toggleLoader(false);
  }

  render() {
    const { accountStore } = this.props.store;
    
    const accounts = accountStore.allAccounts.map((account, idx) => (
      <div key={idx}>
      <Label check>
        <Input type='checkbox' value={account.account_id} onChange={this.handleChange}/>{' '}
        {account.name}
      </Label>
      <br />
      </div>
    ));
    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalHeader>Create Group</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="groupName">Group Name</Label>
              <Input type="text" id="groupName" placeholder="Enter a group name" value={this.state.name} onChange={this.handleChange} />
            </FormGroup>
            <FormGroup check>
              {accounts}
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="success" onClick={this.saveGroup}>Save Group</Button>{' '}
          <Button color="danger" onClick={this.props.toggleModal}>Exit</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

@inject('store')
@observer
class SynchronizeAccountModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { domainStore } = this.props.store;
    const accounts = domainStore.resetAccounts.map((account, idx) => (
      <tr key={idx}>
        <td>{account.name}</td>
        <td>
          
            <span className="float-right">
            <Button color="warning"
                  outline
                  onClick={() => this.props.synchronize(account)}>
                    <i className="fa fa-refresh" /> Sync
            </Button>
            </span>
        </td>
      </tr>
    ));
    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalHeader>Synchronize Accounts</ModalHeader>
        <ModalBody>
          {
            domainStore.resetAccounts.length ? 
          <div>
            <div>The following accounts are not up to date:</div>
            <Table responsive>
              <tbody>
                {accounts}
              </tbody>
            </Table>
          </div>
          : <div>All accounts are up to date.</div>
        }
        </ModalBody>
        <ModalFooter>
          <Button color="success" onClick={this.props.toggleModal}>Done</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

@inject('store')
@observer
class CredentialsModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clientId: '',
      publicKey: '',
      secret: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.saveKeys = this.saveKeys.bind(this);
  }

  handleChange(event) {
    let key;
    switch(event.target.id) {
      case 'plaidClientId':
        key = 'clientId';
        break;
      case 'plaidPublicKey':
        key = 'publicKey';
        break;
      case 'plaidSecretKey':
        key = 'secret';
        break;
    }

    this.setState({
      [key]: event.target.value
    });
  }

  async saveKeys() {
    const uiStore = this.props.store.uiStore;
    uiStore.toggleLoader(true);
    await api.savePlaidCredentials(this.state);
    uiStore.addMessage('Saved plaid credentials.');
    uiStore.toggleLoader(false);
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalHeader>Could not find Plaid credentials</ModalHeader>
        <ModalBody>
          <p>
          You need to enter valid Plaid credentials for Marshmallowsocks Finance to work.
          Get your free credentials <a href="https://dashboard.plaid.com/signup" target="_blank">here.</a><br />
          You can also import a previous configuration.
          </p>
          <Form>
            <FormGroup>
              <Label for="plaidClientId">Client ID</Label>
              <Input type="text" id="plaidClientId" placeholder="Plaid Client ID" value={this.state.clientId} onChange={this.handleChange} />
              <small id="clientIDHelp" className="form-text text-muted">Enter your Plaid Client ID.</small>
            </FormGroup>
            <FormGroup>
              <Label for="plaidPublicKey">Public Key</Label>
              <Input type="text" id="plaidPublicKey" value={this.state.publicKey} onChange={this.handleChange} placeholder="Plaid Public Key" />
              <small id="publicKeyHelp" className="form-text text-muted">Enter your Plaid Public Key.</small>
            </FormGroup>
            <FormGroup>
              <Label for="plaidSecretKey">Secret</Label>
              <Input type="password" id="plaidSecretKey" value={this.state.secret} onChange={this.handleChange} placeholder="Plaid Secret" />
              <small id="secretKeyHelp" className="form-text text-muted">Enter your Plaid Secret.</small>
            </FormGroup>
          </Form>
          <p>The application will restart on saving credentials or importing a database.</p>
        </ModalBody>
        <ModalFooter>
          <Button color="success" onClick={this.saveKeys}>Save Keys</Button>{' '}
          <Button color="primary" onClick={this.props.databaseImport}>Import Database</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

export default SideBar;