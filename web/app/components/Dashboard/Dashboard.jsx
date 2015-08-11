import React from "react";
import {PropTypes, Component} from "react";
import Immutable from "immutable";
import AccountCard from "./AccountCard";

class Dashboard extends Component {

    shouldComponentUpdate(nextProps) {
        return ( !Immutable.is(nextProps.linkedAccounts, this.props.linkedAccounts) )
    }

    render() {
        console.log("[Dashboard.jsx:24] ----- render ----->", this.props);
        let {linkedAccounts} = this.props;

        let itemRows = linkedAccounts.map((a) => {
                console.log( "a", a )
                return ( <AccountCard full_accounts={ {account: a} } />)
            }).toArray();

        return (
            <div className="grid-block vertical medium-4">
                <div className="grid-block page-layout">
                    <div className="grid-block medium-12" style={{alignItems: "flex-start", overflowY: "auto", zIndex: 1}}>
                        <div className="grid-block vertical small-up-1 medium-up-2 large-up-3">
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
