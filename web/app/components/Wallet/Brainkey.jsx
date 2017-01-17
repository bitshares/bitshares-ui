import React, {Component} from "react";
import { connect } from "alt-react";
import Immutable from "immutable";
import cname from "classnames";
import BrainkeyActions from "actions/BrainkeyActions";
import BrainkeyStoreFactory from "stores/BrainkeyStore";
import BindToChainState from "components/Utility/BindToChainState";
import ChainTypes from "components/Utility/ChainTypes";
import BrainkeyInput from "components/Wallet/BrainkeyInput";
import {pairs} from "lodash";
import Translate from "react-translate-component";
import AccountCard from "components/Dashboard/AccountCard";

const connectObject = {
    listenTo() {
        return [BrainkeyStoreFactory.getInstance("wmc")];
    },
    getProps() {
        return BrainkeyStoreFactory.getInstance("wmc").getState();
    }
};

class Brainkey extends Component {
    componentWillUnmount() {
        BrainkeyStoreFactory.closeInstance("wmc");
    }
    render() {
        return (
            <span>
                <h3><Translate content="wallet.brainkey" /></h3>
                <BrainkeyInputAccept>
                    <ViewBrainkey/>
                </BrainkeyInputAccept>
            </span>
        );
    }
}
Brainkey = connect(Brainkey, connectObject);
export default Brainkey;

class ViewBrainkey extends Component {
    render() {
        let short_brnkey = this.props.brnkey.substring(0, 10);
        // console.log("this.props.account_ids.toArray()", this.props.account_ids.toArray())
        return <span>
            <div><span className="">{short_brnkey}</span>&hellip;</div>
            <p></p>
            {this.props.account_ids.size?
            <BrainkeyAccounts accounts={Immutable.List(this.props.account_ids.toArray())}/>:
            <h5><Translate content="wallet.no_accounts" /></h5>}
        </span>;
    }
}
ViewBrainkey = connect(ViewBrainkey, connectObject);

class BrainkeyAccounts {

    static propTypes = {
        accounts: ChainTypes.ChainAccountsList.isRequired
    }

    render() {
        let rows = pairs(this.props.accounts).filter( account => !!account[1] )
            .map( account => account[1].get("name") ).sort()
            .map( name => <AccountCard key={name} account={name}/> );
        return <span>
            {rows}
        </span>;
    }
}
BrainkeyAccounts = BindToChainState(BrainkeyAccounts, {keep_updating: true});

export class BrainkeyInputAccept extends Component {

    constructor() {
        super();
        this.state = { brnkey: "", accept: false };
    }

    render() {
        if(this.state.accept) return <span>{this.props.children}</span>;

        let ready = this.state.brnkey && this.state.brnkey !== "";
        return (
            <span className="grid-container">
                <div>
                    <BrainkeyInput onChange={this.onBrainkeyChange.bind(this)}/>
                </div>
                <div className={cname("button success", {disabled: ! ready})}
                    onClick={this.onAccept.bind(this)}><Translate content="wallet.accept" /></div>
            </span>
        );
    }

    onBrainkeyChange(brnkey) {
        this.setState({ brnkey });
    }

    onAccept() {
        this.setState({accept: true});
        BrainkeyActions.setBrainkey(this.state.brnkey);
    }

}

// <div onClick={this.onLookupAccounts.bind(this)} className="button success">Lookup Accounts</div>
// onLookupAccounts() {
//
// }
