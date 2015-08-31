import React from "react";
import { RouteHandler } from "react-router";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import WalletUnlockStore from "stores/WalletUnlockStore";
import AltContainer from "alt/AltContainer";
import AccountLeftPanel from "./AccountLeftPanel";
import LoadingIndicator from "../LoadingIndicator";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

@BindToChainState()
class AccountPage extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    }

    static defaultProps = {
        account: "props.params.account_name"
    }

    render() {
        return (
            <div className="grid-block page-layout">
                <div className="grid-block medium-2 left-column no-padding">
                    <AltContainer
                        stores={[AccountStore]}
                        inject={{
                            linkedAccounts: () => {
                                return AccountStore.getState().linkedAccounts;
                            },
                            myAccounts: () => {
                                return AccountStore.getState().myAccounts;
                            }
                        }}>
                        <AccountLeftPanel account={this.props.account}/>
                    </AltContainer>
                </div>
                <div className="grid-block medium-10 main-content">
                    <AltContainer
                        stores={[AccountStore, SettingsStore, WalletUnlockStore]}
                        inject={{
                            account_name: () => {
                                return this.props.params.account_name;
                            },
                            linkedAccounts: () => {
                                return AccountStore.getState().linkedAccounts;
                            },
                            searchAccounts: () => {
                                return AccountStore.getState().searchAccounts;
                            },
                            settings: () => {
                                return SettingsStore.getState().settings;
                            },
                            wallet_locked: () => {
                                return WalletUnlockStore.getState().locked;
                            }
                          }}
                        >
                        <RouteHandler account={this.props.account}/>
                    </AltContainer>
                </div>
            </div>
        );
    }
}

AccountPage.contextTypes = {router: React.PropTypes.func.isRequired};

export default AccountPage;
