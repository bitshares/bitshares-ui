import React from "react";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import AltContainer from "alt/AltContainer";
import Dashboard from "./Dashboard";

class DashboardContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[AccountStore, AssetStore]}
                inject={{
                accounts: () => {
                    return AccountStore.getState().accounts;
                },
                balances: () => {
                    return AccountStore.getState().balances;
                },
                currentAccount: () => {
                    return AccountStore.getState().currentAccount;
                },
                assets: () => {
                    return AssetStore.getState().assets;
                }
              }}>
                <Dashboard/>
            </AltContainer>
        );
    }
}

export default DashboardContainer;
