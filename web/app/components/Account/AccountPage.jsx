import React from "react";
import { RouteHandler } from "react-router";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import WalletUnlockStore from "stores/WalletUnlockStore";
import AltContainer from "alt/AltContainer";
import AccountLeftPanel from "./AccountLeftPanel";
import LoadingIndicator from "../LoadingIndicator";

import AccountVoting from "./AccountVoting";

class AccountPage extends React.Component {

    render() {
        let account_name = this.props.params.account_name;
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
                        <AccountLeftPanel account={account_name}/>
                    </AltContainer>
                </div>
                <div className="grid-block medium-10 main-content">
                    <AltContainer
                        stores={[AccountStore, SettingsStore, WalletUnlockStore]}
                        inject={{
                            account_name: () => {
                                return account_name;
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
                        <RouteHandler account={account_name}/>
                    </AltContainer>
                </div>
            </div>
        );
    }
}

AccountPage.contextTypes = {router: React.PropTypes.func.isRequired};

export default AccountPage;
