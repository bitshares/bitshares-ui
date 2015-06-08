import React from "react";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import AltContainer from "alt/AltContainer";
import Notifier from "./Notifier";

class NotifierContainer extends React.Component {

    render() {

        return (
              <AltContainer 
                  stores={[AccountStore, AssetStore]}
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
                    }
                  }} 
                  >
                <Notifier/>
              </AltContainer>
        );
    }
}

export default NotifierContainer;
