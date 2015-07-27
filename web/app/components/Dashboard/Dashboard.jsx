import React from "react";
import {PropTypes, Component} from "react";
import Immutable from "immutable";
import AccountCard from "./AccountCard";

class Dashboard extends Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.linkedAccounts, this.props.linkedAccounts) ||
            !Immutable.is(nextProps.balances, this.props.balances) ||
            !Immutable.is(nextProps.assets, this.props.assets)
        );
    }

    render() {
        console.log("[Dashboard.jsx:24] ----- render ----->", this.props);
        let {assets, balances, linkedAccounts} = this.props;

        let itemRows = linkedAccounts
            .sort((a, b) => { // By BTS balance first then by name
                // if (b.balances[0].amount - a.balances[0].amount === 0) {
                if (b > a) {
                    return -1;
                } else if (b < a) {
                    return 1;
                }
                return 0;
                // }
                // return b.balances[0].amount - a.balances[0].amount;
            })
            .map((a) => {
                return (
                    <AccountCard
                        key={a}
                        assets={assets}
                        account={a}
                        balances={balances.get(a)}
                        />
                );
            }).toArray();

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block medium-12" style={{alignItems: "flex-start", overflowY: "auto", zIndex: 1}}>
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
