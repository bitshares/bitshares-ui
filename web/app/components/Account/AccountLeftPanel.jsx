import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import counterpart from "counterpart";
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

    onUpgradeAccount(id, e) {
        e.preventDefault();
        AccountActions.upgradeAccount(id);
    }

    render() {
        let {account, linkedAccounts} = this.props;
        let account_name = account.get("name");

        let is_my_account = AccountStore.isMyAccount(account);
        let linkBtn = null;
        if (!is_my_account) {
            linkBtn = linkedAccounts.has(account_name) ?
                <a style={{marginBottom: "1rem"}} href className="button outline block-button" onClick={this.onUnlinkAccount.bind(this)}><Translate
                    content="account.unlink"/></a> :
                <a style={{marginBottom: "1rem"}} href className="button outline block-button" onClick={this.onLinkAccount.bind(this)}><Translate
                    content="account.link"/></a>;
        }
        let settings       = counterpart.translate("header.settings");

        return (
            <div className="grid-block vertical account-left-panel no-padding no-overflow">
                <div className="grid-block">
                    <div className="grid-content no-padding">
                        <ConfirmModal
                            modalId="confirm_modal"
                            ref="confirmModal"
                            />

                        <div className="regular-padding">
                            <AccountInfo account={account.get("id")} image_size={{height: 120, width: 120}} my_account={is_my_account}/>
                            {linkedAccounts.has(account_name) && account.lifetime_referrer !== account.id ?
                                (<div className="grid-container" style={{marginBottom: "1rem"}}>
                                    <a href className="button outline block-button" onClick={this.onUpgradeAccount.bind(this, account.id)}><Translate
                                        content="account.upgrade"/></a>
                                </div>)
                                : null
                            }
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
                                <li><Link to="account-payees" params={{account_name}}><Translate content="account.payees"/></Link></li>
                                <li><Link to="account-permissions" params={{account_name}}><Translate content="account.permissions"/></Link></li>
                                <li><Link to="account-voting" params={{account_name}}><Translate content="account.voting"/></Link></li>
                                <li><Link to="account-orders" params={{account_name}}><Translate content="account.orders"/></Link></li>
                            </ul>
                        </section>
                    </div>
                </div>
                {is_my_account ?
                <div className="grid-block shrink bottom">
                    <div className="center">
                        <Link to="create-account"><span data-tip="Create New Account" data-place="top"><Icon name="plus-circle"/></span></Link>
                    </div>
                </div> : null}
            </div>
        );
    }
}

export default AccountLeftPanel;
