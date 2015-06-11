import React from "react";
import WitnessStore from "stores/WitnessStore";
import BlockchainStore from "stores/BlockchainStore";
import AltContainer from "alt/AltContainer";
import Witnesses from "./Witnesses";

class WitnessesContainer extends React.Component {

    render() {
        return (
              <AltContainer 
                  stores={[BlockchainStore, WitnessStore]}
                  inject={{
                    witnesses: () => {
                        return WitnessStore.getState().witnesses;
                    },
                    witness_id_to_name: () => {
                        return WitnessStore.getState().witness_id_to_name;
                    },
                    dynGlobalObject: () => {
                        return BlockchainStore.getState().dynGlobalObject;
                    },
                    globalObject: () => {
                        return BlockchainStore.getState().globalObject;
                    }
                  }} 
                  >
                <Witnesses/>
              </AltContainer>
        );
    }
}

export default WitnessesContainer;
