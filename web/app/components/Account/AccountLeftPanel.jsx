import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import AccountInfo from "./AccountInfo";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";
import ConfirmModal from "../Modal/ConfirmModal";
import notify from 'actions/NotificationActions';
import LoadingIndicator from "../LoadingIndicator";

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
               this.props.linkedAccounts !== nextProps.linkedAccounts;
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
        let callback = () => {
            AccountActions.upgradeAccount(id).then(result => {
                if (result) {
                    notify.addNotification({
                        message: `Successfully upgraded the account`,//: ${this.state.wallet_public_name}
                        level: "success",
                        autoDismiss: 10
                    });
                } else {
                    notify.addNotification({
                        message: `Failed to broadcast upgrade transaction`,//: ${this.state.wallet_public_name}
                        level: "error",
                        autoDismiss: 10
                    });
                }
            })
        };

        let content = (
            <div>
                <span>Upgrade account <strong>{this.props.account_name}</strong> to lifetime member?</span>
            </div>
        );

        this.refs.confirmModal.show(content, "Confirm Upgrade", callback);
        
    }

    render() {
        let {account_name, account_name_to_id, linkedAccounts} = this.props;
        let account_id = account_name_to_id[account_name];
        let account = this.props.cachedAccounts.get(account_id);
        if(!account) return <LoadingIndicator type="circle"/>;

        return (
            <div className="grid-content no-overflow account-left-panel">
                <ConfirmModal
                    modalId="confirm_modal"
                    ref="confirmModal"
                />
                <div className="regular-padding">
                    <AccountInfo account_name={account_name} account_id={account_id} image_size={{height: 120, width: 120}}/>
                    {linkedAccounts.has(account_name) && account.lifetime_referrer !== account_id ?
                    (<div className="grid-block" style={{marginBottom: "1rem"}}>
                        <div className="grid-block center-content">
                            <a href className="button outline block-button" onClick={this.onUpgradeAccount.bind(this, account_id)}><Translate content="account.upgrade" /></a>
                        </div>
                    </div>) : null}
                    <div className="grid-block no-margin account-buttons-row">
                        <div className="grid-block no-margin center-content">
                        {linkedAccounts.has(account_name) ?
                            <a href className="button outline block-button" onClick={this.onUnlinkAccount.bind(this)}><Translate content="account.unlink" /></a> :
                            <a href className="button outline block-button" onClick={this.onLinkAccount.bind(this)}><Translate content="account.link" /></a>
                        }
                        </div>
                        <div className="grid-block no-margin center-content">
                            <Link className="button outline block-button" to="transfer" query={{to: account_name}}><Translate content="account.pay" /></Link>
                        </div>
                    </div>
                </div>
                <section className="block-list">
                    <ul className="account-left-menu">
                        <li><Link to="account-overview" params={{name: account_name}}><Translate content="account.overview" /></Link></li>
                        <li><Link to="account-assets" params={{name: account_name}}><Translate content="explorer.assets.title" /></Link></li>
                        <li><Link to="account-member-stats" params={{name: account_name}}><Translate content="account.member.stats" /></Link></li>
                        <li><Link to="account-history" params={{name: account_name}}><Translate content="account.history" /></Link></li>
                        <li><Link to="account-payees" params={{name: account_name}}><Translate content="account.payees" /></Link></li>
                        <li><Link to="account-permissions" params={{name: account_name}}><Translate content="account.permissions" /></Link></li>
                        <li><Link to="account-voting" params={{name: account_name}}><Translate content="account.voting" /></Link></li>
                        <li><Link to="account-orders" params={{name: account_name}}><Translate content="account.orders" /></Link></li>
                    </ul>
                </section>
            </div>
        );
    }
}

AccountLeftPanel.defaultProps = {
    account_name: ""
};

AccountLeftPanel.propTypes = {
    account_name: PropTypes.string.isRequired
};

AccountLeftPanel.contextTypes = {
    router: React.PropTypes.func
};

export default AccountLeftPanel;
