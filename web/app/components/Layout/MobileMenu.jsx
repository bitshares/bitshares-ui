import React from "react";
import Panel from "react-foundation-apps/src/panel";
import Trigger from "react-foundation-apps/src/trigger";
import {Link} from "react-router";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
import AccountStore from "stores/AccountStore";
import connectToStores from "alt/utils/connectToStores";
import WalletUnlockStore from "stores/WalletUnlockStore";
import WalletManagerStore from "stores/WalletManagerStore";
import SettingsStore from "stores/SettingsStore";
import cnames from "classnames";

@connectToStores
class MobileMenu extends React.Component {
    constructor() {
        super();
        this.state = {};
    }

    static contextTypes = {
      history: React.PropTypes.object
    };

    static getStores() {
      return [AccountStore, WalletUnlockStore, WalletManagerStore, SettingsStore]
    }

    static getPropsFromStores() {
      return {
        linkedAccounts: AccountStore.getState().linkedAccounts,
        currentAccount: AccountStore.getState().currentAccount,
        locked: WalletUnlockStore.getState().locked,
        current_wallet: WalletManagerStore.getState().current_wallet,
        lastMarket: SettingsStore.getState().viewSettings.get("lastMarket")
      }
    }

    onClick() {
        ZfApi.publish("mobile-menu", "close");
    }

    _onNavigate(route, e) {
        e.preventDefault();
        this.context.history.pushState(null, route);
        ZfApi.publish("mobile-menu", "close");
    }

    render() {
        let id = this.props.id;
        let accounts = null;
        let linkedAccounts = AccountStore.getState().linkedAccounts;
        if(linkedAccounts.size > 1) {
            accounts = linkedAccounts.map( a => {
                return <li key={a} onClick={this.onClick}><Link to={`/account/${a}/overview`}>{a}</Link></li>;
            });
        }  else if (linkedAccounts.size === 1) {
            accounts = <li key="account" onClick={this.onClick}><Link to={`/account/${linkedAccounts.first()}/overview`}><Translate component="span" content="header.account" /></Link></li>;
        }

        let linkToAccountOrDashboard;
        if (linkedAccounts.size > 1) linkToAccountOrDashboard = <a onClick={this._onNavigate.bind(this, "/dashboard")}><Translate component="span" content="header.dashboard" /></a>;
        else if (linkedAccounts.size === 1) linkToAccountOrDashboard = <a onClick={this._onNavigate.bind(this, `/account/${linkedAccounts.first()}/overview`)}><Translate component="span" content="header.account" /></a>;
        else linkToAccountOrDashboard = <Link to="/create-account">Create Account</Link>;

        let tradeLink = this.props.lastMarket ?
            <a onClick={this._onNavigate.bind(this, `/market/${this.props.lastMarket}`)}><Translate component="span" content="header.exchange" /></a> :
            <a onClick={this._onNavigate.bind(this, "/explorer/markets")}><Translate component="span" content="header.exchange" /></a>

        return (
            <Panel id={id} position="left">
              <div className="grid-content" style={{zIndex: 200}}>
                <Trigger close={id}>
                  <a className="close-button">&times;</a>
                </Trigger>
                <section style={{marginTop: "3rem"}} className="block-list">
                    <ul>
                        <li>{linkToAccountOrDashboard}</li>
                        <li><a onClick={this._onNavigate.bind(this, "/explorer")}><Translate component="span" content="header.explorer" /></a></li>
                        {linkedAccounts.size === 0 ? null :
                          <li>{tradeLink}</li>}
                        <li onClick={this.onClick}><Link to="transfer"><Translate component="span" content="header.payments"/></Link></li>
                    </ul>
                </section>

                <section style={{marginTop: "3rem"}} className="block-list">
                  <header>Accounts</header>
                  <ul>
                      {accounts}
                  </ul>
                  </section>
                </div>
            </Panel>
        );
    }
}

export default MobileMenu;
