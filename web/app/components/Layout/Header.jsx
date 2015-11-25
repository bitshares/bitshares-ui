import React from "react";
import {Link} from "react-router";
import connectToStores from "alt/utils/connectToStores";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import WalletDb from "stores/WalletDb";
import WalletUnlockStore from "stores/WalletUnlockStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletManagerStore from "stores/WalletManagerStore";
import cnames from "classnames";
import {AccountWrapper} from "../Utility/TotalBalanceValue";



@connectToStores
class Header extends React.Component {

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

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    constructor(props) {
        super();
        this.state = {
            active: null
        };
    }

    componentWillMount() {
        let path = this.context.router.getCurrentPath().replace("/", "");
        path = path.indexOf("market") !== -1 ? "exchange" : path;
        this.setState({
            active: path
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.currentAccount !== this.props.currentAccount ||
            nextProps.locked !== this.props.locked ||
            nextProps.current_wallet !== this.props.current_wallet ||
            nextProps.lastMarket !== this.props.lastMarket ||
            nextState.active !== this.state.active
        );
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

    _onNavigate(route, e) {
        e.preventDefault();
        if (route.route) {
            this.setState({active: route.route});
            this.context.router.transitionTo(route.route, route.params);
        }
        else {
            this.setState({active: route});
            this.context.router.transitionTo(route);
        }
    }

    _onGoBack(e) {
        e.preventDefault();
        // this.context.router.goBack();
        window.history.back();
    }

    _onGoForward(e) {
        e.preventDefault();
        window.history.forward();
    }

    _accountClickHandler(account_name, e) {
        e.preventDefault();
        ZfApi.publish("account_drop_down", "close");
        let router = this.context.router;
        AccountActions.setCurrentAccount(account_name);
        let current_account_name = router.getCurrentParams()["account_name"];
        if(current_account_name && current_account_name !== account_name) {
            let routes = router.getCurrentRoutes();
            this.context.router.transitionTo(routes[routes.length - 1].name, {account_name: account_name});
        }
    }

    render() {
        let {active} = this.state
        let {linkedAccounts, currentAccount} = this.props;
        let settings = counterpart.translate("header.settings");
        let locked_tip = counterpart.translate("header.locked_tip");
        let unlocked_tip = counterpart.translate("header.unlocked_tip");
        let linkToAccountOrDashboard;

        let myAccounts = AccountStore.getMyAccounts();

        if (linkedAccounts.size > 1) linkToAccountOrDashboard = <a className={cnames({active: active === "dashboard"})} onClick={this._onNavigate.bind(this, "dashboard")}><Translate component="span" content="header.dashboard" /></a>;
        else if (linkedAccounts.size === 1) linkToAccountOrDashboard = <a className={cnames({active: active === "account-overview"})} onClick={this._onNavigate.bind(this, {route: "account-overview", params: {account_name: linkedAccounts.first()}})}><Translate component="span" content="header.account" /></a>;
        else linkToAccountOrDashboard = <Link to="create-account">Create Account</Link>;
        let lock_unlock = null;
        if (this.props.current_wallet) lock_unlock = (
            <div className="grp-menu-item" >
            { this.props.locked ?
                <a href onClick={this._toggleLock.bind(this)} data-tip={locked_tip} data-place="bottom" data-type="light"><Icon name="locked"/></a>
                : <a href onClick={this._toggleLock.bind(this)} data-tip={unlocked_tip} data-place="bottom" data-type="light"><Icon name="unlocked"/></a> }
            </div>);


        let tradeLink = this.props.lastMarket && active !== "exchange" ?
            <a className={cnames({active: active === "exchange" || active === "markets"})} onClick={this._onNavigate.bind(this, {route: "exchange", params: {marketID: this.props.lastMarket}})}><Translate component="span" content="header.exchange" /></a>:
            <a className={cnames({active: active === "markets" || active === "exchange"})} onClick={this._onNavigate.bind(this, "markets")}><Translate component="span" content="header.exchange" /></a>

        // Account selector: Only active inside the exchange
        let accountsDropDown = null;

        if (currentAccount && active === "exchange") {

            let account_display_name = currentAccount.length > 20 ? `${currentAccount.slice(0, 20)}..` : currentAccount;
            if (myAccounts.indexOf(currentAccount) < 0) {
                myAccounts.push(currentAccount);
            }

            if(myAccounts.length > 1) {

                let accountsList = myAccounts
                    .sort()
                    .map(name => {
                        return <li key={name}><a href onClick={this._accountClickHandler.bind(this, name)}>{name}</a></li>;
                    });

                accountsDropDown = (
                    <ActionSheet>
                        <ActionSheet.Button title="">
                            <a className="button">
                                <Icon name="user"/>&nbsp;{account_display_name} &nbsp;<Icon name="chevron-down"/>
                            </a>
                        </ActionSheet.Button>
                        <ActionSheet.Content >
                            <ul className="no-first-element-top-border">
                                {accountsList}
                            </ul>
                        </ActionSheet.Content>
                    </ActionSheet>);
            }
        }

        return (
            <div className="header menu-group primary">
                <div className="show-for-small-only">
                    <ul className="primary menu-bar title">
                        <li><a href onClick={this._triggerMenu}><Icon name="menu"/></a></li>
                    </ul>
                </div>
                {window.electron ? <div className="grid-block show-for-medium shrink">
                    <ul className="menu-bar">
                        <li><div style={{marginLeft: "1rem", height: "3rem"}}><div style={{marginTop: "0.5rem"}} onClick={this._onGoBack.bind(this)} className="button outline">{"<"}</div></div></li>
                        <li><div style={{height: "3rem"}}><div style={{marginTop: "0.5rem"}} onClick={this._onGoForward.bind(this)} className="button outline">></div></div></li>
                    </ul>
                </div> : null}
                <div className="grid-block show-for-medium">
                    <ul className="menu-bar">
                        <li>{linkToAccountOrDashboard}</li>
                        <li><a className={cnames({active: active === "explorer"})} onClick={this._onNavigate.bind(this, "explorer")}><Translate component="span" content="header.explorer" /></a></li>
                        {linkedAccounts.size === 0 ? null :
                            <li>{tradeLink}</li>}
                        <li><a className={cnames({active: active === "transfer"})} onClick={this._onNavigate.bind(this, "transfer")}><Translate component="span" content="header.payments" /></a></li>
                    </ul>
                </div>
                <div className="grid-block show-for-medium shrink">
                    <div className="grp-menu-items-group header-right-menu">
                        <div className="grid-block shrink overflow-visible account-drop-down">
                            {accountsDropDown}
                        </div>
                        <div className="grp-menu-item" style={{paddingRight: "0.5rem"}} >
                            <AccountWrapper account={currentAccount} />
                        </div>
                        <div className="grp-menu-item" >
                            <Link to="settings" data-tip={settings} data-place="bottom" data-type="light"><Icon name="cog"/></Link>
                        </div>
                        {lock_unlock}
                        <div className="grp-menu-item" >
                            <Link to="help"><Translate component="span" content="header.help"/></Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Header;
