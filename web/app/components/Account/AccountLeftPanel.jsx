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

class AccountLeftPanel extends React.Component {

    shouldComponentUpdate(nextProps) {
        if(this.context.router) {
            const changed = this.pureComponentLastPath !== this.context.router.getCurrentPath();
            this.pureComponentLastPath = this.context.router.getCurrentPath();
            if(changed) {
                return true;
            }
        }
        return this.props.account_name !== nextProps.account_name ||
               this.props.linkedAccounts !== nextProps.linkedAccounts ||
               !Immutable.is(this.props.cachedAccounts, nextProps.cachedAccounts) ||
               !Immutable.is(this.props.assets, nextProps.assets);
    }

    onLinkAccount(e) {
        e.preventDefault();
        AccountActions.linkAccount(this.props.account_name);
    }

    onUnlinkAccount(e) {
        e.preventDefault();
        AccountActions.unlinkAccount(this.props.account_name);
    }

    onUpgradeAccount(id, e) {
        e.preventDefault();
        AccountActions.upgradeAccount(id);
    }

    render() {
        let {account_name, account_name_to_id, linkedAccounts, myAccounts} = this.props;
        let account = this.props.cachedAccounts.get(account_name);
        let accountExists = true;
        
        if (!account) {
            return <LoadingIndicator type="circle"/>;
        } else if (account.notFound) {
            accountExists = false;
        }

        let is_my_account = myAccounts.has(account_name);
        let linkBtn = null;
        if (!is_my_account && accountExists) {
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
                {accountExists ?
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
                    </div> : null}
                <section className="block-list">
                    <ul className="account-left-menu">
                        <li><Link to="account-overview" params={{account_name: account_name}}><Translate content="account.overview" /></Link></li>
                        <li><Link to="account-assets" params={{account_name: account_name}}><Translate content="explorer.assets.title" /></Link></li>
                        <li><Link to="account-member-stats" params={{account_name: account_name}}><Translate content="account.member.stats" /></Link></li>
                        <li><Link to="account-history" params={{account_name: account_name}}><Translate content="account.history" /></Link></li>
                        <li><Link to="account-payees" params={{account_name: account_name}}><Translate content="account.payees" /></Link></li>
                        <li><Link to="account-permissions" params={{account_name: account_name}}><Translate content="account.permissions" /></Link></li>
                        <li><Link to="account-voting" params={{account_name: account_name}}><Translate content="account.voting" /></Link></li>
                        <li><Link to="account-orders" params={{account_name: account_name}}><Translate content="account.orders" /></Link></li>
                    </ul>
                </section>
            </div>
        );
    }
}

AccountLeftPanel.defaultProps = {
    account_name: "",
    account_name_to_id: {},
    linkedAccounts: {},
    myAccounts: {}
};

AccountLeftPanel.propTypes = {
    account_name: PropTypes.string.isRequired,
    account_name_to_id: PropTypes.object.isRequired,
    linkedAccounts: PropTypes.object.isRequired,
    cachedAccounts: PropTypes.object
};

AccountLeftPanel.contextTypes = {
    router: React.PropTypes.func
};

export default AccountLeftPanel;
