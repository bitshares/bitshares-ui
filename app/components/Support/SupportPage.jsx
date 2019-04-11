/**
 * The Support Container component
 *
 * A wrapper component that passes in data from various stores.
 */
import React from "react";
import AltContainer from "alt-container";
import Support from "./Support";
import BindToChainState from "../Utility/BindToChainState";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import CryptoBridgeStore from "stores/CryptoBridgeStore";
import WalletDb from "stores/WalletDb";
import SupportStore from "./stores/SupportStore";
import {withRouter} from "react-router-dom";

class SupportPage extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[
                    AccountStore,
                    CryptoBridgeStore,
                    SupportStore,
                    SettingsStore
                ]}
                inject={{
                    settings: () => {
                        return SettingsStore.getState().settings;
                    },
                    account: () => {
                        return AccountStore.getState().currentAccount;
                    },
                    accountAccess: () => {
                        return CryptoBridgeStore.getAccountAccess(
                            AccountStore.getState().currentAccount
                        );
                    },
                    state: () => {
                        return SupportStore.getState();
                    },
                    locked: () => {
                        return WalletDb.isLocked();
                    }
                }}
            >
                <Support {...this.props} />
            </AltContainer>
        );
    }
}

SupportPage = BindToChainState(SupportPage, {
    auth_required: true,
    auth_required_redirect_home: true
});

SupportPage = withRouter(SupportPage);

export default SupportPage;
