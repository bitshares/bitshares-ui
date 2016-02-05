import React from "react";
import {Link, PropTypes} from "react-router";
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
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import Immutable from "immutable";

@connectToStores
class Header extends React.Component {

    static getStores() {
        return [AccountStore, WalletUnlockStore, WalletManagerStore, SettingsStore]
    }

    static getPropsFromStores() {
        const account_store = AccountStore.getState();
        const settings_store = SettingsStore.getState();
        return {
            linkedAccounts: account_store.linkedAccounts,
            currentAccount: account_store.currentAccount,
            locked: WalletUnlockStore.getState().locked,
            current_wallet: WalletManagerStore.getState().current_wallet,
            lastMarket: settings_store.viewSettings.get("lastMarket"),
            starredAccounts: settings_store.starredAccounts,
            multiAccountMode: settings_store.settings.get("multiAccountMode")
        };
    }

    static contextTypes = {
        location: React.PropTypes.object,
        history: PropTypes.history
    };

    constructor(props) {
        super();
        this.state = {
            active: null
        };
    }

    componentWillMount() {
        this.context.history.listen((err, newState) => {
            if (!err) {
                if (this.state.active !== newState.location.pathname) {
                    this.setState({
                        active: newState.location.pathname
                    });
                }
            }
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.currentAccount !== this.props.currentAccount ||
            nextProps.locked !== this.props.locked ||
            nextProps.current_wallet !== this.props.current_wallet ||
            nextProps.lastMarket !== this.props.lastMarket ||
            nextProps.starredAccounts !== this.props.starredAccounts ||
            nextProps.multiAccountMode !== this.props.multiAccountMode ||
            nextState.active !== this.state.active
        );
    }

    componentWillReceiveProps(nextProps) {
        // this._setActivePath();
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
        this.context.history.pushState(null, route);
    }

    _onGoBack(e) {
        e.preventDefault();
        window.history.back();
    }

    _onGoForward(e) {
        e.preventDefault();
        window.history.forward();
    }

    _accountClickHandler(account_name, e) {
        e.preventDefault();
        ZfApi.publish("account_drop_down", "close");
        AccountActions.setCurrentAccount(account_name);
    }

    render() {
        let {active} = this.state;
        let {linkedAccounts, currentAccount, starredAccounts} = this.props;
        let settings = counterpart.translate("header.settings");
        let locked_tip = counterpart.translate("header.locked_tip");
        let unlocked_tip = counterpart.translate("header.unlocked_tip");

        let linkToAccountOrDashboard;

        let tradingAccounts = AccountStore.getMyAccounts();

        if (starredAccounts.size) {
            for (let i = tradingAccounts.length - 1; i >= 0; i--) {
                if (!starredAccounts.has(tradingAccounts[i])) {
                    tradingAccounts.splice(i, 1);
                }
            };
            starredAccounts.forEach(account => {
                if (tradingAccounts.indexOf(account.name) === -1) {
                    tradingAccounts.push(account.name);
                }
            });
        }

        let myAccounts = AccountStore.getMyAccounts();

        let myAccountsList = Immutable.List(myAccounts);

        let walletBalance = myAccounts.length ? (
                            <div className="grp-menu-item" style={{paddingRight: "0.5rem"}} >
                                <TotalBalanceValue.AccountWrapper accounts={myAccounts} inHeader={true}/>
                            </div>) : null;

        if (this.props.multiAccountMode || linkedAccounts.size > 1) {
            linkToAccountOrDashboard = (
                <a className={cnames({active: active === "/" || active.indexOf("dashboard") !== -1})} onClick={this._onNavigate.bind(this, "/dashboard")}>
                    <Translate component="span" content="header.dashboard" />
                </a>
            );
        } else if (linkedAccounts.size === 1) {
                linkToAccountOrDashboard = (
                    <a className={cnames({active: active.indexOf("account/") !== -1})} onClick={this._onNavigate.bind(this, `/account/${linkedAccounts.first()}/overview/`)}>
                        <Translate component="span" content="header.account" />
                    </a>
                );
        } else {
            linkToAccountOrDashboard = (
                <a className={cnames({active: active.indexOf("create-account") !== -1})} onClick={this._onNavigate.bind(this, "/create-account")}>
                    <Translate content="header.create_account" />
                </a>
            );
        }
        let lock_unlock = null;
        if (this.props.current_wallet) lock_unlock = (
            <div className="grp-menu-item" >
            { this.props.locked ?
                <a href onClick={this._toggleLock.bind(this)} data-tip={locked_tip} data-place="bottom" data-type="light" data-html><Icon name="locked"/></a>
                : <a href onClick={this._toggleLock.bind(this)} data-tip={unlocked_tip} data-place="bottom" data-type="light" data-html><Icon name="unlocked"/></a> }
            </div>);

        let tradeLink = this.props.lastMarket && active.indexOf("market/") === -1 ?
            <a className={cnames({active: active.indexOf("market/") !== -1})} onClick={this._onNavigate.bind(this, `/market/${this.props.lastMarket}`)}><Translate component="span" content="header.exchange" /></a>:
            <a className={cnames({active: active.indexOf("market/") !== -1})} onClick={this._onNavigate.bind(this, "/explorer/markets")}><Translate component="span" content="header.exchange" /></a>

        // Account selector: Only active inside the exchange
        let accountsDropDown = null;

        if (currentAccount && active.indexOf("market/") !== -1) {

            let account_display_name = currentAccount.length > 20 ? `${currentAccount.slice(0, 20)}..` : currentAccount;
            if (tradingAccounts.indexOf(currentAccount) < 0) {
                tradingAccounts.push(currentAccount);
            }

            if (tradingAccounts.length > 1) {

                let accountsList = tradingAccounts
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
                        <li><a className={cnames({active: active.indexOf("explorer") !== -1})} onClick={this._onNavigate.bind(this, "/explorer")}><Translate component="span" content="header.explorer" /></a></li>
                        <li>{tradeLink}</li>
                        <li><a className={cnames({active: active.indexOf("transfer") !== -1})} onClick={this._onNavigate.bind(this, "/transfer")}><Translate component="span" content="header.payments" /></a></li>
                    </ul>
                </div>
                <div className="grid-block show-for-medium shrink">
                    <div className="grp-menu-items-group header-right-menu">
                        <div className="grid-block shrink overflow-visible account-drop-down">
                            {accountsDropDown}
                        </div>
                        {walletBalance}
                        <div className="grp-menu-item" >
                            <Link to="/settings" data-tip={settings} data-place="bottom" data-type="light"><Icon name="cog"/></Link>
                        </div>
                        {lock_unlock}
                        <div className="grp-menu-item" >
                            <Link to="/help"><Translate component="span" content="header.help"/></Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Header;
