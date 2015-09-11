import React from "react";
import {PropTypes, Component} from "react";
import Immutable from "immutable";
import AccountCard from "./AccountCard";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";



@BindToChainState()
class Dashboard extends Component {

    static propTypes = {
      linkedAccounts: PropTypes.object.isRequired,
      resolvedLinkedAccounts: ChainTypes.ChainAccountsList.isRequired
    };

    render() {
        let itemRows = this.props.linkedAccounts.map( a => <AccountCard key={a} account={a}/> ).toArray();

        return (
            <div className="grid-block page-layout">
                <div className="grid-block" style={{alignItems: "flex-start", overflowY: "auto", zIndex: 1}}>
                    <div className="grid-block regular-padding small-up-1 medium-up-2 large-up-3">
                        {itemRows}
                    </div>
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

export default Dashboard;
