import React from "react";
import AssetStore from "stores/AssetStore";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt/AltContainer";
import Assets from "./Assets";

class AssetsContainer extends React.Component {

    render() {

        return (
              <AltContainer 
                  stores={[AssetStore, AccountStore]}
                  inject={{
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    accounts: () => {
                        return AccountStore.getState().accounts;
                    }
                  }} 
                  >
                <Assets/>
              </AltContainer>
        );
    }
}

export default AssetsContainer;
