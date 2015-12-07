import React from "react";
import ReactDOM from "react-dom";
import Immutable from "immutable";
import AccountCard from "./AccountCard";
import RecentTransactions from "../Account/RecentTransactions";
import Translate from "react-translate-component";
import Proposals from "components/Account/Proposals";
import ps from "perfect-scrollbar";

class Dashboard extends React.Component {

    componentDidMount() {
        let c = ReactDOM.findDOMNode(this.refs.container);
        ps.initialize(c);
        let t = ReactDOM.findDOMNode(this.refs.transactions);
        ps.initialize(t);
    }

    render() {
        let names = this.props.linkedAccounts.toArray().sort();
        let itemRows = [];
        for(let a of names)
            itemRows.push(<AccountCard key={a} account={a}/>);

        return (
            <div  className="grid-block page-layout horizontal no-overflow">
                <div ref="container" className="grid-block flex-start" style={{overflowY: "auto", zIndex: 1}}>
                    <div className="grid-block regular-padding small-up-1 medium-up-1 large-up-3">
                        {itemRows}
                    </div>
                </div>
                <div className="grid-block shrink show-for-medium right-column">
                    <div ref="transactions" className="grid-content">
                        <h4><Translate content="account.recent" /></h4>
                        <RecentTransactions accountsList={this.props.linkedAccounts} limit={25} compactView={true}/>
                    </div>
                </div>
            </div>);
    }
}

export default Dashboard;
