import React from "react";
import {PropTypes, Component} from "react";
import Immutable from "immutable";
import AccountCard from "./AccountCard";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import RecentTransactions from "../Account/RecentTransactions";
import HelpContent from "../Utility/HelpContent";
import Translate from "react-translate-component";

@BindToChainState()
class Dashboard extends Component {

    static propTypes = {
      linkedAccounts: PropTypes.object.isRequired,
    }

    render() {
        let names = this.props.linkedAccounts.toArray().sort()
        let itemRows = []
        for(let a of names)
            itemRows.push(<AccountCard key={a} account={a}/>)

        return (
            <div className="grid-block page-layout vertical medium-horizontal">
                <div className="grid-block medium-8 flex-start" style={{overflowY: "auto", zIndex: 1}}>
                    <div className="grid-block regular-padding small-up-1 medium-up-2 large-up-3">
                        {itemRows}
                    </div>
                </div>
                <div className="grid-block medium-4 right-column">
                    <div className="grid-content">
                        <h4><Translate content="account.recent" /></h4>
                        <RecentTransactions accountsList={this.props.linkedAccounts} limit={20} compactView={true}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default Dashboard;
