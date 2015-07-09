import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import AccountInfo from "./AccountInfo";
import Translate from "react-translate-component";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import BaseComponent from "../BaseComponent";

class AccountLeftPanel extends BaseComponent {

    constructor(props) {
        super(props, AccountStore);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return true;
    }

    onLinkAccount(e) {
        e.preventDefault();
        AccountActions.linkAccount(this.props.account_name);
    }

    onUnlinkAccount(e) {
        e.preventDefault();
        AccountActions.unlinkAccount(this.props.account_name);
    }

    render() {
        let account_name = this.props.account_name;
        let account_id = AccountStore.getState().account_name_to_id[account_name];
        return (
            <div className="grid-content no-overflow account-left-panel">
                <div className="regular-padding">
                    <AccountInfo account_name={account_name} account_id={account_id} image_size={{height: 120, width: 120}}/>
                    <div className="grid-block no-margin account-buttons-row">
                        <div className="grid-block no-margin center-content">
                        {this.state.linkedAccounts.has(account_name) ?
                            <a href className="button outline block-button" onClick={this.onUnlinkAccount.bind(this)}>Unlink</a> :
                            <a href className="button outline block-button" onClick={this.onLinkAccount.bind(this)}>Link</a>
                        }
                        </div>
                        <div className="grid-block no-margin center-content">
                            <Link className="button outline block-button" to="transfer" query={{to: account_name}}>Pay</Link>
                        </div>
                    </div>
                </div>
                <section className="block-list">
                    <ul className="account-left-menu">
                        <li><Link to="account-overview" params={{name: account_name}}>Overview</Link></li>
                        <li><Link to="account-member-stats" params={{name: account_name}}>Member Stats</Link></li>
                        <li><Link to="account-history" params={{name: account_name}}>History</Link></li>
                        <li><Link to="account-payees" params={{name: account_name}}>Payees</Link></li>
                        <li><Link to="account-permissions" params={{name: account_name}}>Permissions</Link></li>
                        <li><Link to="account-voting" params={{name: account_name}}>Voting</Link></li>
                        <li><Link to="account-orders" params={{name: account_name}}>Orders</Link></li>
                    </ul>
                </section>
            </div>
        );
    }
}

AccountLeftPanel.propTypes = {
    account_name: PropTypes.string.isRequired
};

export default AccountLeftPanel;
