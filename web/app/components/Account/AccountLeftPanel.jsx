import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import AccountInfo from "./AccountInfo";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";
import ConfirmModal from "../Modal/ConfirmModal";
import notify from "actions/NotificationActions";
import LoadingIndicator from "../LoadingIndicator";
import Immutable from "immutable";
import WalletDb from "stores/WalletDb";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

@BindToChainState()
class AccountLeftPanel extends React.Component {

    static defaultProps = {
        linkedAccounts: {},
        myAccounts: {}
    }

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        linkedAccounts: PropTypes.object.isRequired,
        myAccounts: PropTypes.object.isRequired
    };

    static contextTypes = {
        router: React.PropTypes.func
    }

    shouldComponentUpdate(nextProps) {
        //if(this.context.router) {
        //    const changed = this.pureComponentLastPath !== this.context.router.getCurrentPath();
        //    this.pureComponentLastPath = this.context.router.getCurrentPath();
        //    if(changed) return true;
        //}
        return this.props.account !== nextProps.account ||
               this.props.linkedAccounts !== nextProps.linkedAccounts ||
               this.props.myAccounts !== nextProps.myAccounts;
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
        let {account, linkedAccounts, myAccounts} = this.props;
        let account_name = account.get("name");

        let is_my_account = myAccounts.has(account_name);
        let linkBtn = null;
        if (!is_my_account) {
            linkBtn = linkedAccounts.has(account_name) ?
                        <a style={{marginBottom: "1rem"}} href className="button outline block-button" onClick={this.onUnlinkAccount.bind(this)}><Translate content="account.unlink"/></a> :
                        <a style={{marginBottom: "1rem"}} href className="button outline block-button" onClick={this.onLinkAccount.bind(this)}><Translate content="account.link"/></a>;
        }

        return (
            <div className="grid-content account-left-panel no-padding">
                <ConfirmModal
                    modalId="confirm_modal"
                    ref="confirmModal"
                />
                <div className="regular-padding">
                    <AccountInfo account_name={account_name} account_id={account.id} image_size={{height: 120, width: 120}} my_account={is_my_account}/>
                    {linkedAccounts.has(account_name) && account.lifetime_referrer !== account.id ?
                        (<div className="grid-container" style={{marginBottom: "1rem"}}>
                            <a href className="button outline block-button" onClick={this.onUpgradeAccount.bind(this, account.id)}><Translate content="account.upgrade" /></a>
                        </div>)
                        : null
                    }
                    <div className="grid-container no-margin">
                        { linkBtn }
                        <Link className="button outline block-button" to="transfer" query={{to: account_name}}><Translate content="account.pay" /></Link>
                    </div>
                </div>
                <section className="block-list">
                    <ul className="account-left-menu">
                        <li><Link to="account-overview" params={{account_name}}><Translate content="account.overview" /></Link></li>
                        <li><Link to="account-assets" params={{account_name}}><Translate content="explorer.assets.title" /></Link></li>
                        <li><Link to="account-member-stats" params={{account_name}}><Translate content="account.member.stats" /></Link></li>
                        <li><Link to="account-history" params={{account_name}}><Translate content="account.history" /></Link></li>
                        <li><Link to="account-payees" params={{account_name}}><Translate content="account.payees" /></Link></li>
                        <li><Link to="account-permissions" params={{account_name}}><Translate content="account.permissions" /></Link></li>
                        <li><Link to="account-voting" params={{account_name}}><Translate content="account.voting" /></Link></li>
                        <li><Link to="account-orders" params={{account_name}}><Translate content="account.orders" /></Link></li>
                    </ul>
                </section>
            </div>
        );
    }
}

export default AccountLeftPanel;
