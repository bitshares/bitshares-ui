import React from "react";
import AccountSelector from "./AccountSelector";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import Translate from "react-translate-component";

@BindToChainState()
class AccountVotingProxy extends React.Component {

    static propTypes = {
        proxyAccount: ChainTypes.ChainAccount,
        currentAccount: React.PropTypes.object.isRequired,
        onProxyAccountChanged: React.PropTypes.func.isRequired
    }

    constructor(props){
        super(props);
        this.state = {
            current_proxy_input: props.currentProxy,
            new_proxy_account: null
        }
        this.onProxyChange = this.onProxyChange.bind(this);
        this.onProxyAccountChange = this.onProxyAccountChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if(!this.state.current_proxy_input) this.setState({
            current_proxy_input: nextProps.proxyAccount ? nextProps.proxyAccount.get("name") : ""
        });

        if (nextProps.currentProxy !== this.state.current_proxy_input) {
            this.setState({
                current_proxy_input: nextProps.currentProxy
            });
        }
    }

    onProxyChange(current_proxy_input) {
        //console.log("-- AccountVotingProxy.onProxyChange -->", current_proxy_input);
        this.setState({current_proxy_input})
    }

    onProxyAccountChange(new_proxy_account) {
        //console.log("-- AccountVotingProxy.onProxyAccountChange -->", new_proxy_account);
        if(new_proxy_account && this.props.currentAccount.get("id") === new_proxy_account.get("id"))
            this.props.onProxyAccountChanged(null, this.state.current_proxy_input);
        else
            this.props.onProxyAccountChanged(new_proxy_account, this.state.current_proxy_input);
        this.setState({new_proxy_account});
    }

    render(){
        //console.log("-- AccountVotingProxy.render -->", this.props.proxyAccount);
        let error = null;
        if(this.state.new_proxy_account && this.props.currentAccount.get("id") === this.state.new_proxy_account.get("id"))
            error = "cannot proxy to yourself";
        return (
        <div className="content-block" style={{maxWidth: "600px"}}>
            <h3><Translate content="account.votes.proxy_short" /></h3>
            <AccountSelector label="account.votes.proxy"
                             error={error}
                             account={this.state.current_proxy_input}
                             accountName={this.state.current_proxy_input}
                             onChange={this.onProxyChange}
                             onAccountChanged={this.onProxyAccountChange}
                             ref="proxy_selector" tabIndex={1}/>
        </div>
        );
    }

}

export default AccountVotingProxy;
