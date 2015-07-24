import React from "react";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import AltContainer from "alt/AltContainer";
import Transfer from "./Transfer";

class TransferPage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <AltContainer
                stores={[AccountStore, AssetStore]}
                inject={{
                cachedAccounts: () => {
                    return AccountStore.getState().cachedAccounts;
                },
                myAccounts: () => {
                    return AccountStore.getState().myAccounts;
                },
                payeeAccounts: () => {
                    return AccountStore.getState().linkedAccounts;
                },
                currentAccount: () => {
                    return AccountStore.getState().currentAccount;
                },
                accountBalances: () => {
                    return AccountStore.getState().balances;
                },
                assets: () => {
                    return AssetStore.getState().assets;
                },
                account_name_to_id: () => {
                    return AccountStore.getState().account_name_to_id;
                }
              }}>
                <Transfer />
            </AltContainer>
        );
    }
}


export default TransferPage;
