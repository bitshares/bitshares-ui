import React from "react";
import {PropTypes, Component} from "react";
import Immutable from "immutable";
import AccountCard from "./AccountCard";

class Dashboard extends Component {

    shouldComponentUpdate(nextProps) {
        return ( !Immutable.is(nextProps.linkedAccounts, this.props.linkedAccounts) )
    }

    render() {
        let itemRows = this.props.linkedAccounts.map( a => <AccountCard full_accounts={ {account: a} } /> ).toArray();

        return (
            <div className="grid-block page-layout">
                <div className="grid-block regular-padding small-up-1 medium-up-2 large-up-3">
                    {itemRows}
                </div>
                <div className="grid-block medium-3 right-column">
                    <div className="grid-content">
                        <h4>Recent Transactions</h4>
                        TODO
                    </div>
                </div>
            </div>
        );
    }
}


Dashboard.defaultProps = {
    linkedAccounts: {},
    assets: {},
    balances: {}
};

Dashboard.propTypes = {
    linkedAccounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    balances: PropTypes.object.isRequired
};

export default Dashboard;
