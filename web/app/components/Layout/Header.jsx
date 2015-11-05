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

@connectToStores
class Header extends React.Component {

    static getStores() {
        return [AccountStore, WalletUnlockStore, WalletManagerStore, SettingsStore]
    }

    static getPropsFromStores() {
        return {
            linkedAccounts: AccountStore.getState().linkedAccounts,
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
        let path = route.route ? route.route : route;
        this.setState({active: route.route ? route.route : route});
        
        switch(path) {
            case "exchange":
                this.context.router.transitionTo(path, route.params);
                break;

            default:
                this.context.router.transitionTo(path);
                break;
        }

    }

    render() {
        let {active} = this.state
        let linkedAccounts = this.props.linkedAccounts;
        let settings = counterpart.translate("header.settings");
        let locked_tip = counterpart.translate("header.locked_tip");
        let unlocked_tip = counterpart.translate("header.unlocked_tip");
        let linkToAccountOrDashboard;

        if (linkedAccounts.size > 1) linkToAccountOrDashboard = <a className={cnames({active: active === "dashboard"})} onClick={this._onNavigate.bind(this, "dashboard")}><Translate component="span" content="header.dashboard" /></a>;
        else if (linkedAccounts.size === 1) linkToAccountOrDashboard = <Link to="account-overview" params={{account_name: linkedAccounts.first()}}><Translate component="span" content="header.account" /></Link>;
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
        return (
            <div className="header menu-group primary">
                <div className="show-for-small-only">
                    <ul className="primary menu-bar title">
                        <li><a href onClick={this._triggerMenu}><Icon name="menu"/></a></li>
                    </ul>
                </div>

                <div className="show-for-medium medium-8">
                    <ul className="menu-bar">
                        <li>{linkToAccountOrDashboard}</li>
                        <li><a className={cnames({active: active === "explorer"})} onClick={this._onNavigate.bind(this, "explorer")}><Translate component="span" content="header.explorer" /></a></li>
                        {linkedAccounts.size === 0 ? null :
                            <li>{tradeLink}</li>}
                        <li><a className={cnames({active: active === "transfer"})} onClick={this._onNavigate.bind(this, "transfer")}><Translate component="span" content="header.payments" /></a></li>
                    </ul>
                </div>
                <div className="show-for-medium medium-4">
                    <div className="grp-menu-items-group header-right-menu">
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
