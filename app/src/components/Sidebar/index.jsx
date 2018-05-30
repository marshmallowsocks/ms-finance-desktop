import React from 'react';
import {
  Nav,
  Navbar,
  NavItem,
  NavLink,
  Button,
} from 'reactstrap';
import {
  inject,
  observer
} from 'mobx-react';
import { NavLink as RRNavLink } from 'react-router-dom';

import api from '../../api';
import styles from './styles.css';

@inject('store')
@observer
class SideBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { uiStore } = this.props.store;
    return (
      <Navbar className={`col-md-2 d-none d-md-block bg-light ${styles.sidebar}`}>
        <div className={`${styles['sidebar-sticky']}`}>
          <Nav className={"flex-column"}>
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
          </Nav>
        </div>
      </Navbar>
    );
  }
}

export default SideBar;