import React from "react";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import AltContainer from "alt/AltContainer";
import Notifier from "./Notifier";
import WitnessStore from "stores/WitnessStore";

class NotifierContainer extends React.Component {

    render() {

        return (
              <AltContainer 
                  stores={[AccountStore, AssetStore, WitnessStore]}
                  inject={{
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    account_id_to_name: () => {
                        return AccountStore.getState().account_id_to_name;
                    },
                    currentAccount: () => {
                        return AccountStore.getState().currentAccount;
                    },
                    accountHistories: () => {
                        return AccountStore.getState().accountHistories;
                    },
                    witnesses: () => {
                        return WitnessStore.getState().witnesses;
                    },
                    witness_id_to_name: () => {
                        return WitnessStore.getState().witness_id_to_name;
                    }
                  }} 
                  >
                <Notifier/>
              </AltContainer>
        );
    }
}

export default NotifierContainer;
