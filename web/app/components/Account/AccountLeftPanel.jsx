import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import AccountInfo from "./AccountInfo";
import Translate from "react-translate-component";
import AccountStore from "stores/AccountStore";

class AccountLeftPanel extends React.Component {

    render() {
        let account_name = this.props.account_name;
        let account_id = AccountStore.getState().account_name_to_id[account_name];
        return (
            <div className="grid-content no-overflow">
                <div className="regular-padding">
                    <AccountInfo account_name={account_name} account_id={account_id} image_size={{height: 120, width: 120}}/>
                </div>
                <section className="block-list">
                    <ul className="account-left-menu">
                        <li><Link to="account-overview" params={{name: account_name}}>Overview</Link></li>
                        <li><Link to="transfer"><Translate component="span" content="header.payments" /></Link></li>
                        <li><Link to="account-member-stats" params={{name: account_name}}>Member Stats</Link></li>
                        <li><Link to="account-history" params={{name: account_name}}>History</Link></li>
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
