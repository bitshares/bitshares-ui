import React from "react";
import {PropTypes, Component} from "react";
import Immutable from "immutable";
import AccountCard from "./AccountCard";

class Dashboard extends Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.accounts, this.props.accounts) ||
            !Immutable.is(nextProps.balances, this.props.balances) ||
            !Immutable.is(nextProps.assets, this.props.assets)
        );
    }

    render() {
        console.log("[Dashboard.jsx:24] ----- render ----->", this.props);
        let {assets, balances, accounts} = this.props;

        let itemRows = accounts
            .sort((a, b) => { // By BTS balance first then by name
                // if (b.balances[0].amount - a.balances[0].amount === 0) {
                if (b.name > a.name) {
                    return -1;
                } else if (b.name < a.name) {
                    return 1;
                }
                return 0;
                // }
                // return b.balances[0].amount - a.balances[0].amount;
            })
            .map((a) => {
                return (
                    <AccountCard
                        key={a.name}
                        assets={assets}
                        account={a}
                        balances={balances.get(a.id)}
                        />
                );
            }).toArray();

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block medium-12" style={{alignItems: "flex-start"}}>
                        <div className="grid-block small-up-1 medium-up-2 large-up-3">
                            {itemRows}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


Dashboard.defaultProps = {
    accounts: {},
    assets: {}
};

Dashboard.propTypes = {
    accounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired
};

export default Dashboard;
