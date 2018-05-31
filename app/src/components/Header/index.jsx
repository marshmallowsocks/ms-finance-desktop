import React from 'react';
import PropTypes from 'prop-types';
import { remote } from 'electron';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
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
  Table,
} from 'reactstrap';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-bootstrap-typeahead/css/Typeahead-bs4.css';
import { Typeahead } from 'react-bootstrap-typeahead';
import {
  observer,
  inject
} from 'mobx-react';

import PlaidLink from '../PlaidLink';

import api from '../../api';
import helpers from '../../util/helpers';
import styles from './styles.css';

// DEPRECATED
@inject("store")
@observer
class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      groupModal: false,
    };

    this.fileInput = React.createRef();
    this.toggle = this.toggle.bind(this);
    this.toggleCreateGroup = this.toggleCreateGroup.bind(this);
    this.databaseImport = this.databaseImport.bind(this);
    this.importDatabase = this.importDatabase.bind(this);
    this.exportDatabase = this.exportDatabase.bind(this);
    this.handlePlaidExit = this.handlePlaidExit.bind(this);
    this.handlePlaidSuccess = this.handlePlaidSuccess.bind(this);
  }

  handlePlaidExit() {
    const { uiStore } = this.props.store;
    uiStore.addMessage('Bank linking aborted.');
  }

  async handlePlaidSuccess(token, metadata) {
    const { accountStore, uiStore } = this.props.store;
    uiStore.toggleLoader(true);
    try {
      const result = await api.exchangePublicToken(token);
      if(!result.error) {
        const { name, itemId, products } = await api.fetchLatestInstitutionData();
        const accountData = await api.fetchAccountData(itemId);
        accountStore.addAccount(accountData.data);
        uiStore.addMessage(`${name} linked successfully.`);
      }
    }
    catch(e) {
      uiStore.addMessage('Failed to link bank account.');
      throw Error(e);
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

  render() {
    const { uiStore, domainStore, accountStore } = this.props.store;
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
      <Navbar fixed={'top'} expand className={`flex-md-nowrap p-0 shadow ${styles.navbar}`}>
        <div className={`w-100 offset-sm-3 offset-md-2`}>
          <span style={{fontSize: '18px'}}>Net balance: </span><span className={`float-right ${netBalanceMarkup.className}`} style={{fontSize: '18px'}}>{netBalanceMarkup.balance}</span>
        </div>
        <Nav className={'ml-auto'} navbar>
          <UncontrolledDropdown nav inNavbar>
            <DropdownToggle nav>
              <Button color='success' outline>
                <i className="fa fa-gear"></i>
              </Button>
            </DropdownToggle>
            <DropdownMenu right>
              {domainStore.plaidAvailable ?
              <PlaidLink
                clientName="Marshmallowsocks Finance"
                env="sandbox"
                product={["transactions"]}
                publicKey={domainStore.plaidCredentials.public_key}
                onExit={this.handlePlaidExit}
                onSuccess={this.handlePlaidSuccess}>
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
            </DropdownMenu>
          </UncontrolledDropdown>
        </Nav>
      </Navbar>
      <CredentialsModal isOpen={!domainStore.plaidAvailable} databaseImport={this.databaseImport}/>
      <CryptoModal isOpen={this.state.modal} toggleModal={this.toggle} />
      <CreateGroupModal isOpen={this.state.groupModal} toggleModal={this.toggleCreateGroup} />
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
};

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
};

export default Header;