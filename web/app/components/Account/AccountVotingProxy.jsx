import React from "react";
import AccountSelector from "./AccountSelector";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import Translate from "react-translate-component";
import AccountImage from "../Account/AccountImage";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import {List} from "immutable";

class AccountVotingProxy extends React.Component {

    static propTypes = {
        proxyAccount: ChainTypes.ChainAccount,
        currentAccount: React.PropTypes.object.isRequired,
        onProxyAccountChanged: React.PropTypes.func.isRequired,
        knownProxies: ChainTypes.ChainAccountsList
    };

    static defaultProps = {
        knownProxies: List(
            [
                "baozi", "bitsharesblocks", "laomao", "xeroc", "bitcrab",
                "jonnybitcoin", "jakub", "dacs", "fav"
            ]
        )
    };

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    };

    constructor(props){
        super(props);
        this.state = {
            current_proxy_input: props.currentProxy,
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
        let {knownProxies} = this.props;
        const isDisabled = !!this.props.proxyAccount;
        // console.log("-- AccountVotingProxy.render -->", this.props.currentAccount);
        let error = null;
        if(this.state.new_proxy_account && this.props.currentAccount.get("id") === this.state.new_proxy_account.get("id")) {
            error = "cannot proxy to yourself";
        }

        let currentProxyName = this.props.proxyAccount && this.props.proxyAccount.get("name");

        let proxies = knownProxies
        .filter(a => {
            if (!a) return false;
            return (
                a.get("name") !== this.props.currentAccount.get("name") &&
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
                {isDisabled ? null :
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
