import React from "react";
import BlockchainStore from "stores/BlockchainStore";
import AltContainer from "alt/AltContainer";
import Block from "./Block";

class BlockContainer extends React.Component {

    render() {
        let height = parseInt(this.context.router.getCurrentParams().height, 10);

        return (
              <AltContainer 
                  stores={[BlockchainStore]}
                  inject={{
                    blocks: () => {
                        return BlockchainStore.getState().blocks;
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
