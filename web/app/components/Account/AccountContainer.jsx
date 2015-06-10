import React from "react";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import SessionStore from "stores/SessionStore";
import WitnessStore from "stores/WitnessStore";
import AltContainer from "alt/AltContainer";
import Account from "./Account";

class AccountContainer extends React.Component {

    render() {
        let name = this.context.router.getCurrentParams().name;
        // {flexWrap: "nowrap" is needed because medium-horizontal applies wrap, making the layout incorrect}
        return (
              <AltContainer 
                  stores={[AccountStore, AssetStore, SessionStore, WitnessStore]}
                  inject={{
                    browseAccounts: () => {
                        return AccountStore.getState().browseAccounts;
                    },
                    accountBalances: () => {
                        return AccountStore.getState().balances;
                    },
                    accountHistories: () => {
                        return AccountStore.getState().accountHistories;
                    },
                    account_name_to_id: () => {
                        return AccountStore.getState().account_name_to_id;
                    },
                    account_id_to_name: () => {
                        return AccountStore.getState().account_id_to_name;
                    },
                    activeAccount: () => {
                        return AccountStore.getState().currentAccount;
                    },
                    isUnlocked: () => {
                        return SessionStore.getState().isUnlocked;
                    },
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    witnesses: () => {
                        return WitnessStore.getState().witnesses;
                    },
                    witness_id_to_name: () => {
                        return WitnessStore.getState().witness_id_to_name;
                    }
                  }} 
                  >
                <Account accountName={name}/>
              </AltContainer>
        );
    }
}

AccountContainer.contextTypes = { router: React.PropTypes.func.isRequired };

export default AccountContainer;
