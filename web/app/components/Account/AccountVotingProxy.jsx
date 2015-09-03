import React from "react";
import AccountSelector from "./AccountSelector";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";

@BindToChainState()
class AccountVotingProxy extends React.Component {

    static propTypes = {
        proxyAccount: ChainTypes.ChainAccount.isRequired,
        currentAccount: React.PropTypes.object.isRequired,
        onProxyAccountChanged: React.PropTypes.func.isRequired
    }

    constructor(props){
        super(props);
        this.state = {
            current_proxy_input: this.props.proxyAccount.get("name"),
            new_proxy_account: null
        }
        this.onProxyChange = this.onProxyChange.bind(this);
        this.onProxyAccountChange = this.onProxyAccountChange.bind(this);
    }

    onProxyChange(current_proxy_input) {
        //console.log("-- AccountVotingProxy.onProxyChange -->", current_proxy_input);
        this.setState({current_proxy_input})
    }

    onProxyAccountChange(new_proxy_account) {
        //console.log("-- AccountVotingProxy.onProxyAccountChange -->", new_proxy_account);
        if(new_proxy_account && this.props.currentAccount.get("id") === new_proxy_account.get("id"))
            this.props.onProxyAccountChanged(null);
        else
            this.props.onProxyAccountChanged(new_proxy_account);
        this.setState({new_proxy_account});
    }

    render(){
        //console.log("-- AccountVotingProxy.render -->", this.props.proxyAccount);
        let error = null;
        if(this.state.new_proxy_account && this.props.currentAccount.get("id") === this.state.new_proxy_account.get("id"))
            error = "cannot proxy to yourself";
        return (
        <div className="content-block">
            <h3>Proxy</h3>
            <AccountSelector label="account.votes.proxy"
                             error={error}
                             account={this.state.current_proxy_input}
                             accountName={this.state.current_proxy_input}
                             onChange={this.onProxyChange}
                             onAccountChanged={this.onProxyAccountChange}
                             ref="proxy_selector"/>
        </div>
        );
    }

}

export default AccountVotingProxy;
