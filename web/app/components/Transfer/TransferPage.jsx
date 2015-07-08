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
                accounts_list: () => {
                    return AccountStore.getState().account_name_to_id;
                },
                currentAccount: () => {
                    return AccountStore.getState().currentAccount;
                },
                accountBalances: () => {
                    return AccountStore.getState().balances;
                },
                assets: () => {
                    return AssetStore.getState().assets;
                }
              }}>
                <Transfer addNotification={this.props.addNotification}/>
            </AltContainer>
        );
    }
}


export default TransferPage;
