import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import LoadingIndicator from "../LoadingIndicator";

class AccountPayees extends React.Component {

    render() {
        let {account_name, cachedAccounts} = this.props;
        let account = account_name ? cachedAccounts.get(account_name) : null;

        let accountExists = true;
        if (!account) {
            return <LoadingIndicator type="circle"/>;
        } else if (account.notFound) {
            accountExists = false;
        } 
        if (!accountExists) {
            return <div className="grid-block"><h5><Translate component="h5" content="account.errors.not_found" name={account_name} /></h5></div>;
        }

        return (
            <div className="grid-content no-overflow">
                AccountPayees
            </div>
        );
    }
}

export default AccountPayees;
