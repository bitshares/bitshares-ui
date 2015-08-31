import React from "react";
import {Link} from "react-router";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import AccountActions from "actions/AccountActions";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";

class Header extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        // return nextState.currentAccount !== this.state.currentAccount;
        return true;
    }

    closeDropDowns() {
        ZfApi.publish("account_drop_down", "close");
        ZfApi.publish("plus_drop_down", "close");
    }

    accountClickHandler(account_name, e) {
        e.preventDefault();
        this.closeDropDowns();
        let router = this.context.router;
        AccountActions.setCurrentAccount(account_name);
        let current_account_name = router.getCurrentParams()["account_name"];
        if(current_account_name && current_account_name !== account_name) {
            let routes = router.getCurrentRoutes();
            this.context.router.transitionTo(routes[routes.length - 1].name, {account_name: account_name});
        }
    }

    transitionTo(to, params, query, e) {
        e.preventDefault();
        this.closeDropDowns();
        this.context.router.transitionTo(to, params, query);
        return false;
    }

    _triggerMenu(e) {
        e.preventDefault();
        ZfApi.publish("mobile-menu", "toggle");
    }

    _toggleLock(e) {
        e.preventDefault();
        if (WalletDb.isLocked()) WalletUnlockActions.unlock();
        else WalletUnlockActions.lock();
    }

    render() {
        if(!WalletDb.getWallet()) return null;
        //DEBUG console.log('... render WalletDb.isLocked()',WalletDb.isLocked())
        
        let {currentAccount, linkedAccounts} = this.props, accountsDropDown = null, plusDropDown = null;

        let settings = counterpart.translate("header.settings");
        let current = counterpart.translate("header.current");
        if (currentAccount) {

            let account_display_name = currentAccount.length > 20 ? `${currentAccount.slice(0, 20)}..` : currentAccount;

            if(linkedAccounts.size > 1) {
                let accountsList = linkedAccounts
                    .sort()
                    .map(name => {
                        return <li key={name}><a href onClick={this.accountClickHandler.bind(this, name)}>{name}</a></li>;
                    });

                accountsDropDown = (
                    <ActionSheet id="account_drop_down">
                        <ActionSheet.Button title="">
                            <a className="button">
                                &nbsp;{account_display_name} &nbsp;<Icon name="chevron-down"/>
                            </a>
                        </ActionSheet.Button>
                        <ActionSheet.Content >
                            <ul className="no-first-element-top-border">
                                {accountsList}
                            </ul>
                        </ActionSheet.Content>
                    </ActionSheet>);
            }
            else {
                accountsDropDown = (
                    <Link to="account-overview" params={{account_name: currentAccount}}><Icon name="user"/> {account_display_name}</Link>
                );
            }

        }

        plusDropDown = (
            <ActionSheet id="plus_drop_down">
                <ActionSheet.Button title="">
                    <a className="button">
                        <Icon name="plus-circle"/>
                    </a>
                </ActionSheet.Button>
                <ActionSheet.Content >
                    <ul className="no-first-element-top-border">
                        <li><a href onClick={this.transitionTo.bind(this, "create-account", null, null)}>Create Account</a></li>
                        {currentAccount ? <li><a href onClick={this.transitionTo.bind(this, "account-assets", {account_name: currentAccount}, {create_asset: true})}>Create Asset</a></li> : null}
                    </ul>
                </ActionSheet.Content>
            </ActionSheet>
        );

        return (
            <div>
            <div className="header menu-group primary">
                <div className="show-for-small-only">
                    <ul className="primary menu-bar title">
                        <li><a href onClick={this._triggerMenu}><Icon name="menu"/></a></li>
                    </ul>
                </div>

                <div className="show-for-medium medium-8">
                    <ul className="menu-bar">
                        <li><Link to="dashboard"><Translate component="span" content="header.dashboard" /></Link></li>
                        <li><Link to="explorer"><Translate component="span" content="header.explorer" /></Link></li>
                        <li><Link to="markets"><Translate component="span" content="header.exchange" /></Link></li>
                        <li><Link to="transfer"><Translate component="span" content="header.payments" /></Link></li>
                    </ul>
                </div>
                <div className="show-for-medium medium-4">
                    <div className="grp-menu-items-group">
                        <div className="grp-menu-item user-icon">
                            {currentAccount && linkedAccounts.size > 1 ? <Link to="account-overview" data-tip={current} data-place="bottom" params={{account_name: currentAccount}}><Icon name="user"/></Link> : null}
                        </div>
                        <div className="grp-menu-item">
                            {accountsDropDown}
                        </div>
                        <div className="grp-menu-item">
                            {plusDropDown}
                        </div>
                        <div className="grp-menu-item" >
                            <Link to="settings" className="button" data-tip={settings} data-place="bottom"><Icon name="cog"/></Link>
                        </div>
                        <div className="grp-menu-item" >
                            <a href onClick={this._toggleLock.bind(this)}>{ WalletDb.isLocked() ? "Unlock" : "Lock" }</a>
                        </div>
                        
                    </div>
                </div>
            </div>
            </div>
        );
    }


}

Header.contextTypes = {router: React.PropTypes.func.isRequired};

export default Header;
