import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";
import Icon from "../Icon/Icon";
import AccountInfo from "./AccountInfo";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";
import ConfirmModal from "../Modal/ConfirmModal";
import notify from "actions/NotificationActions";
import LoadingIndicator from "../LoadingIndicator";
import Immutable from "immutable";
import WalletDb from "stores/WalletDb";

class AccountLeftPanel extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired,
        linkedAccounts: PropTypes.object,
    };

    static contextTypes = {
        router: React.PropTypes.func
    }

    shouldComponentUpdate(nextProps) {
        if (this.context.router) {
            const changed = this.pureComponentLastPath !== this.context.router.getCurrentPath();
            this.pureComponentLastPath = this.context.router.getCurrentPath();
            if (changed) return true;
        }
        return this.props.account !== nextProps.account ||
            this.props.linkedAccounts !== nextProps.linkedAccounts
    }

    onLinkAccount(e) {
        e.preventDefault();
        AccountActions.linkAccount(this.props.account.get("name"));
    }

    onUnlinkAccount(e) {
        e.preventDefault();
        AccountActions.unlinkAccount(this.props.account.get("name"));
    }

    onCreateAccountClick(e) {
        e.preventDefault();
        ReactTooltip.hide();
        this.context.router.transitionTo("create-account");
    }

    render() {
        let {account, linkedAccounts, isMyAccount} = this.props;
        let account_name = account.get("name");
        let linkBtn = null;
        if (!isMyAccount) {
            linkBtn = linkedAccounts.has(account_name) ?
                <a style={{marginBottom: "1rem"}} href className="button outline block-button" onClick={this.onUnlinkAccount.bind(this)}><Translate
                    content="account.unfollow"/></a> :
                <a style={{marginBottom: "1rem"}} href className="button outline block-button" onClick={this.onLinkAccount.bind(this)}><Translate
                    content="account.follow"/></a>;
        }
        let settings       = counterpart.translate("header.settings");
        return (
            <div className="grid-block vertical account-left-panel no-padding no-overflow">
                <div className="grid-block">
                    <div className="grid-content no-padding">
                        <ConfirmModal
                            modalId="confirm_modal"
                            ref="confirmModal" />

                        <div className="regular-padding">
                            <AccountInfo account={account.get("id")} image_size={{height: 120, width: 120}} my_account={isMyAccount}/>
                            <div className="grid-container no-margin">
                                { linkBtn }
                                <Link className="button outline block-button" to="transfer" query={{to: account_name}}><Translate content="account.pay"/></Link>
                            </div>
                        </div>
                        <section className="block-list">
                            <ul className="account-left-menu">
                                <li><Link to="account-overview" params={{account_name}}><Translate content="account.overview"/></Link></li>
                                <li><Link to="account-assets" params={{account_name}}><Translate content="explorer.assets.title"/></Link></li>
                                <li><Link to="account-member-stats" params={{account_name}}><Translate content="account.member.stats"/></Link></li>
                                {/*<li><Link to="account-payees" params={{account_name}}><Translate content="account.payees"/></Link></li>*/}
                                <li><Link to="account-permissions" params={{account_name}}><Translate content="account.permissions"/></Link></li>
                                <li><Link to="account-voting" params={{account_name}}><Translate content="account.voting"/></Link></li>
                                <li><Link to="account-orders" params={{account_name}}><Translate content="account.orders"/></Link></li>
                                {isMyAccount ? <li><Link to="account-deposit-withdraw" params={{account_name}}><Translate content="account.deposit_withdraw"/></Link></li> : null}
                            </ul>
                        </section>
                    </div>
                </div>
                {isMyAccount ?
                <div className="grid-block shrink bottom">
                    <div className="center">
                        <a href data-tip="Create New Account" data-place="top" onClick={this.onCreateAccountClick.bind(this)}><Icon name="plus-circle"/></a>
                    </div>
                </div> : null}
            </div>
        );
    }
}

export default AccountLeftPanel;
