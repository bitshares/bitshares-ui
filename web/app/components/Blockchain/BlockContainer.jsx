import React from "react";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import BlockchainStore from "stores/BlockchainStore";
import WitnessStore from "stores/WitnessStore";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt/AltContainer";
import Block from "./Block";

class BlockContainer extends React.Component {

    render() {
        let height = parseInt(this.context.router.getCurrentParams().height, 10);
        // {flexWrap: "nowrap" is needed because medium-horizontal applies wrap, making the layout incorrect}
        return (
              <AltContainer 
                  stores={[AccountStore, AssetStore, BlockchainStore, WitnessStore, SettingsStore]}
                  inject={{
                    blocks: () => {
                        return BlockchainStore.getState().blocks;
                    },
                    dynGlobalObject: () => {
                        return BlockchainStore.getState().dynGlobalObject;
                    },
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    account_id_to_name: () => {
                        return AccountStore.getState().account_id_to_name;
                    },
                    witnesses: () => {
                        return WitnessStore.getState().witnesses;
                    },
                    witness_id_to_name: () => {
                        return WitnessStore.getState().witness_id_to_name;
                    },
                    settings: () => {
                        return SettingsStore.getState().settings;
                    }
                  }} 
                  >
                <Block height={height}/>
              </AltContainer>
        );
    }
}

BlockContainer.contextTypes = { router: React.PropTypes.func.isRequired };

export default BlockContainer;
