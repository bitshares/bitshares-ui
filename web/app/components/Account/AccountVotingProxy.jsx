import React from "react";
import {Link} from "react-router";
import AccountSelector from "./AccountSelector";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import Translate from "react-translate-component";
import AccountImage from "../Account/AccountImage";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import {List} from "immutable";

class AccountVotingProxy extends React.Component {

    static propTypes = {
        existingProxy: ChainTypes.ChainAccount.isRequired,
        account: React.PropTypes.object.isRequired,
        onProxyAccountChanged: React.PropTypes.func.isRequired,
        knownProxies: ChainTypes.ChainAccountsList
    };

    static defaultProps = {
        knownProxies: List(
            [
                "xeroc", "baozi", "bitcrab", "laomao", "bitshares-munich-wallet",
                "bts1988", "harvey", "fav", "jonnybitcoin", "bitsharesblocks"
            ]
        ),
        existingProxy: "1.2.5" // proxy-to-self
    };

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    };

    constructor(props){
        super(props);
        const defaultInput = props.existingProxy.get("id") === "1.2.5" ? "" : props.existingProxy.get("name");

        this.state = {
            current_proxy_input: defaultInput,
            new_proxy_account: null
        };
        this.onProxyChange = this.onProxyChange.bind(this);
        this.onProxyAccountChange = this.onProxyAccountChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if(!this.state.current_proxy_input) {
            this.setState({
                current_proxy_input: nextProps.proxyAccount ? nextProps.proxyAccount.get("name") : ""
            });
        }
    }
    //     console.log("nextProps", nextProps.currentProxy);
    //     if (!nextProps.currentProxy && nextProps.currentProxy !== this.state.current_proxy_input) {
    //         this.setState({
    //             current_proxy_input: nextProps.currentProxy
    //         });
    //     }
    // }

    onResetProxy() {
        const defaultInput = this.props.existingProxy.get("id") === "1.2.5" ? "" : this.props.existingProxy.get("name");
        this.setState({
            current_proxy_input: defaultInput,
            new_proxy_account: null
        });
    }

    clearProxy() {
        this.setState({
            current_proxy_input: "",
            new_proxy_account: null
        });
        if (this.props.onClearProxy) this.props.onClearProxy();
    }

    onProxyChange(current_proxy_input) {
        //console.log("-- AccountVotingProxy.onProxyChange -->", current_proxy_input);
        this.setState({current_proxy_input});
    }

    onProxyAccountChange(new_proxy_account) {
        //console.log("-- AccountVotingProxy.onProxyAccountChange -->", new_proxy_account);

        this.setState({new_proxy_account}, () => {
            if(new_proxy_account && this.props.account.get("id") === new_proxy_account.get("id")) {
                // this.props.onProxyAccountChanged(null);
            } else {
                this.props.onProxyAccountChanged(new_proxy_account);
            }
        });
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
        let {knownProxies, existingProxy} = this.props;
        const isDisabled = existingProxy && existingProxy.get("name") === this.state.current_proxy_input;
        // console.log("-- AccountVotingProxy.render -->", this.props.account);
        let error = null;
        if(this.state.new_proxy_account && this.props.account.get("id") === this.state.new_proxy_account.get("id")) {
            error = "cannot proxy to yourself";
        }

        let currentProxyName = this.props.proxyAccount && this.props.proxyAccount.get("name");

        let proxies = knownProxies
        .filter(a => {
            if (!a) return false;
            return (
                a.get("name") !== this.props.account.get("name") &&
                a.get("name") !== currentProxyName
            );
        })
        .map(proxy => {
            return (
                <tr key={proxy.get("id")}>
                    <td>
                        <AccountImage
                            size={{height: 30, width: 30}}
                            account={proxy.get("name")}
                            custom_image={null}
                        />
                    </td>
                    <td><LinkToAccountById account={proxy.get("id")} subpage="voting" /></td>
                    <td className="text-right"><button className="button" onClick={this.onProxyChange.bind(this, proxy.get("name"))}>Set</button></td>
                </tr>
            );
        });

        return (
            <div className="content-block" style={{maxWidth: "600px"}}>
                {isDisabled ? null :<Translate component="h3" content="account.votes.proxy_short" />}
                {isDisabled ? <div>
                    <p>
                        <Translate content="account.votes.proxy_current" />:
                        &nbsp;<Link to={`account/${existingProxy.get("name")}`}>{existingProxy.get("name")}</Link>
                    </p>
                    <div>
                        <button className={"button outline"} onClick={this.clearProxy.bind(this)} tabIndex={8}>
                            <Translate content="account.votes.clear_proxy"/>
                        </button>
                    </div>
                </div> :
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
                />}
                {!isDisabled && knownProxies.length ? (
                <div>
                    <Translate component="h4" content="account.votes.proxy_known" />
                    <table className="table">
                        <tbody>
                            {proxies}
                        </tbody>
                    </table>
                </div>) : null}
                {this.props.children}
            </div>
        );
    }
}

export default BindToChainState(AccountVotingProxy);
