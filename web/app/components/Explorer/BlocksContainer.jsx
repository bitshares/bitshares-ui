import React from "react";
import BlockchainStore from "stores/BlockchainStore";
import AltContainer from "alt-container";
import Blocks from "./Blocks";

class BlocksContainer extends React.Component {

    render() {

        return (
              <AltContainer 
                  stores={[BlockchainStore]}
                  inject={{
                    latestBlocks: () => {
                        return BlockchainStore.getState().latestBlocks;
                    },
                    latestTransactions: () => {
                        return BlockchainStore.getState().latestTransactions;
                    }
                  }} 
                  >
                <Blocks/>
              </AltContainer>
        );
    }
}

export default BlocksContainer;
