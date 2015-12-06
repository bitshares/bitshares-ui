import React from "react";
import BlockchainStore from "stores/BlockchainStore";
import AltContainer from "alt-container";
import Block from "./Block";

class BlockContainer extends React.Component {

    render() {
        let height = parseInt(this.props.params.height, 10);

        return (
              <AltContainer 
                  stores={[BlockchainStore]}
                  inject={{
                    blocks: () => {
                        return BlockchainStore.getState().blocks;
                    }
                  }} 
                  >
                <Block {...this.props} height={height}/>
              </AltContainer>
        );
    }
}

export default BlockContainer;
