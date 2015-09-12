import React from "react";
import AccountStore from "stores/AccountStore";
import BlockchainStore from "stores/BlockchainStore";
import WitnessStore from "stores/WitnessStore";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt/AltContainer";
import Blocks from "./Blocks";

class BlocksContainer extends React.Component {

    render() {
        return (
              <AltContainer 
                  stores={[AccountStore, BlockchainStore, WitnessStore, SettingsStore]}
                  inject={{
                    latestBlocks: () => {
                        return BlockchainStore.getState().latestBlocks;
                    },
                    latestTransactions: () => {
                        return BlockchainStore.getState().latestTransactions;
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
                <Blocks globalObject={this.props.globalObject} dynGlobalObject={this.props.dynGlobalObject} />
              </AltContainer>
        );
    }
}

export default BlocksContainer;
