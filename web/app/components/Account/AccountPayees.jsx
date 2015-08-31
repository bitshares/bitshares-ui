import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";

class AccountPayees extends React.Component {
    render() {
        let {account_name, account} = this.props;

        return (
            <div className="grid-content no-overflow">
                AccountPayees
            </div>
        );
    }
}

export default AccountPayees;
