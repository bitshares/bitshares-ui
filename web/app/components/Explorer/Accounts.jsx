import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import AccountActions from "actions/AccountActions";

class Accounts extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            Object.keys(nextProps.account_id_to_name).length !== Object.keys(this.props.account_id_to_name).length
        );
    }

    componentDidMount() {
        AccountActions.getAccounts("A", 1000);
    }

    render() {

        let {account_id_to_name} = this.props;

        let accountRows = [];

        for (let id in account_id_to_name) {
            if (account_id_to_name.hasOwnProperty(id)) {
                accountRows.push(
                    <tr key={id}>
                        <td>{id}</td>
                        <td><Link to="account" params={{name: account_id_to_name[id]}}>{account_id_to_name[id]}</Link></td>
                    </tr>
                    );
            }
        }

        accountRows.sort((a, b) => {
            return parseInt(a.key.split(".")[2], 10) - parseInt(b.key.split(".")[2], 10);
        });

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-container">
                        <div className="grid-content">
                            <h3>Accounts</h3>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th><Translate component="span" content="explorer.assets.id" /></th>
                                        <th><Translate component="span" content="account.name" /></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {accountRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Accounts.defaultProps = {
    account_id_to_name: {}
};

Accounts.propTypes = {
    account_id_to_name: PropTypes.object.isRequired
};

export default Accounts;
