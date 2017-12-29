import React from "react";
import BlockchainStore from "stores/BlockchainStore";
import AltContainer from "alt-container";
import Blocks from "./Blocks";
import Explorer from "./Explorer";

class BlocksContainer extends React.Component {

    render() {

        let content = 
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
              </AltContainer>;
        
        return (<Explorer tab="blocks" content={content}/>);
        
    }
}

export default BlocksContainer;
