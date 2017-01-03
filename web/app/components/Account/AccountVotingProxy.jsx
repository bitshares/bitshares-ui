import React from "react";
import AccountSelector from "./AccountSelector";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import Translate from "react-translate-component";
import AccountImage from "../Account/AccountImage";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import {ChainStore} from "graphenejs-lib";

class AccountVotingProxy extends React.Component {

    static propTypes = {
        proxyAccount: ChainTypes.ChainAccount,
        currentAccount: React.PropTypes.object.isRequired,
        onProxyAccountChanged: React.PropTypes.func.isRequired
    };


    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

    constructor(props){
        super(props);
        this.state = {
            current_proxy_input: props.currentProxy,
            new_proxy_account: null
        };
        this.onProxyChange = this.onProxyChange.bind(this);
        this.onProxyAccountChange = this.onProxyAccountChange.bind(this);
        this._onUpdate = this._onUpdate.bind(this);
    }

    componentWillMount() {
        ChainStore.subscribe(this._onUpdate);
    }

    componentWillUnmount() {
        ChainStore.unsubscribe(this._onUpdate);
    }

    _onUpdate() {
        this.forceUpdate();
    }

    componentWillReceiveProps(nextProps) {
        if(!this.state.current_proxy_input) {
            this.setState({
                current_proxy_input: nextProps.proxyAccount ? nextProps.proxyAccount.get("name") : ""
            });
        }

        if (nextProps.currentProxy !== this.state.current_proxy_input) {
            this.setState({
                current_proxy_input: nextProps.currentProxy
            });
        }
    }

    onProxyChange(current_proxy_input) {
        //console.log("-- AccountVotingProxy.onProxyChange -->", current_proxy_input);
        this.setState({current_proxy_input});
    }

    onProxyAccountChange(new_proxy_account) {
        //console.log("-- AccountVotingProxy.onProxyAccountChange -->", new_proxy_account);
        if(new_proxy_account && this.props.currentAccount.get("id") === new_proxy_account.get("id"))
            this.props.onProxyAccountChanged(null, this.state.current_proxy_input);
        else
            this.props.onProxyAccountChanged(new_proxy_account, this.state.current_proxy_input);
        this.setState({new_proxy_account});
    }

    _onNavigate(route) {
        this.context.router.push(route);
        // this._changeTab();
    }

    // _changeTab() {
    //     SettingsActions.changeViewSetting({
    //         votingTab: 3
    //     });
    // }

    render(){
        // console.log("-- AccountVotingProxy.render -->", this.props.currentAccount);
        let error = null;
        if(this.state.new_proxy_account && this.props.currentAccount.get("id") === this.state.new_proxy_account.get("id")) {
            error = "cannot proxy to yourself";
        }

        let core = ChainStore.getObject("1.3.0");
        let knownProxies = [];
        if (core && core.get("symbol")) {
            knownProxies = ["baozi", "bytemaster", "laomao", "xeroc", "bitcrab", "jonnybitcoin", "angel", "jakub", "dacs", "fav"];
        }

        let proxies = knownProxies
        .filter(a => {
            return a !== this.props.currentAccount.get("name");
        })
        .map(proxy => {
            let account = ChainStore.getAccount(proxy);
            if (account) {
                return (
                    <tr key={account.get("id")}>
                        <td>
                            <AccountImage
                                size={{height: 30, width: 30}}
                                account={account.get("name")}
                                custom_image={null}
                            />
                        </td>
                        <td><LinkToAccountById account={account.get("id")} subpage="voting" /></td>
                        <td className="text-right"><button className="button" onClick={this.onProxyChange.bind(this, account.get("name"))}>Set</button></td>
                    </tr>
                );
            } else {
                return null;
            }
        }).filter(a => {
            return a !== null;
        });

        return (
            <div className="content-block" style={{maxWidth: "600px"}}>
                <Translate component="h3" content="account.votes.proxy_short" />
                <AccountSelector
                    label="account.votes.proxy"
                     error={error}
                     account={this.state.current_proxy_input}
                     accountName={this.state.current_proxy_input}
                     onChange={this.onProxyChange}
                     onAccountChanged={this.onProxyAccountChange}
                     ref="proxy_selector" tabIndex={1}
                     onAction={this._onNavigate.bind(this, `/account/${this.state.current_proxy_input}/voting/`)}
                     action_label="account.votes.go_proxy"
                />
                {knownProxies.length ? (
                <div>
                    <Translate component="h4" content="account.votes.proxy_known" />
                    <table className="table">
                        <tbody>
                            {proxies}
                        </tbody>
                    </table>
                </div>) : null}
            </div>
        );
    }

}

export default BindToChainState(AccountVotingProxy);
