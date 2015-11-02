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

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.locked !== this.props.locked ||
            nextProps.current_wallet !== this.props.current_wallet ||
            nextProps.lastMarket !== this.props.lastMarket
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

    render() {
        //if(!this.props.current_wallet) return null;
        let linkedAccounts = this.props.linkedAccounts;
        let settings = counterpart.translate("header.settings");
        let locked_tip = counterpart.translate("header.locked_tip");
        let unlocked_tip = counterpart.translate("header.unlocked_tip");
        let linkToAccountOrDashboard;
        if (linkedAccounts.size > 1) linkToAccountOrDashboard = <Link to="dashboard"><Translate component="span" content="header.dashboard" /></Link>;
        else if (linkedAccounts.size === 1) linkToAccountOrDashboard = <Link to="account-overview" params={{account_name: linkedAccounts.first()}}><Translate component="span" content="header.account" /></Link>;
        else linkToAccountOrDashboard = <Link to="create-account">Create Account</Link>;
        let lock_unlock = null;
        if (this.props.current_wallet) lock_unlock = (
            <div className="grp-menu-item" >
            { this.props.locked ?
                <a href onClick={this._toggleLock.bind(this)} data-tip={locked_tip} data-place="bottom" data-type="light"><Icon name="locked"/></a>
                : <a href onClick={this._toggleLock.bind(this)} data-tip={unlocked_tip} data-place="bottom" data-type="light"><Icon name="unlocked"/></a> }
            </div>);

        let tradeLink = this.props.lastMarket ?
            <Link to="exchange" params={{marketID: this.props.lastMarket}}><Translate component="span" content="header.exchange" /></Link>:
            <Link to="markets"><Translate component="span" content="header.exchange" /></Link>
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
                        <li><Link to="explorer"><Translate component="span" content="header.explorer" /></Link></li>
                        {linkedAccounts.size === 0 ? null :
                            <li>{tradeLink}</li>}
                        <li><Link to="transfer"><Translate component="span" content="header.payments" /></Link></li>
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
