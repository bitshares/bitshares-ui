import React from "react";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import BlockchainStore from "stores/BlockchainStore";
import WitnessStore from "stores/WitnessStore";
import AltContainer from "alt/AltContainer";
import Discover from "./Discover";

class DiscoverContainer extends React.Component {

    render() {

        return (
              <AltContainer 
                  stores={[AccountStore, AssetStore, BlockchainStore, WitnessStore]}
                  inject={{
                    latestBlocks: () => {
                        return BlockchainStore.getState().latestBlocks;
                    },
                    dynGlobalObject: () => {
                        return BlockchainStore.getState().dynGlobalObject;
                    },
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    accounts: () => {
                        return AccountStore.getState().accounts;
                    },
                    witnesses: () => {
                        return WitnessStore.getState().witnesses;
                    },
                    witness_id_to_name: () => {
                        return WitnessStore.getState().witness_id_to_name;
                    }
                  }} 
                  >
                <Discover/>
              </AltContainer>
        );
    }
}

export default DiscoverContainer;
