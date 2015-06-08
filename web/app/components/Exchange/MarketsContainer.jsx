import React from "react";
import MarketsStore from "stores/MarketsStore";
import AssetStore from "stores/AssetStore";
import BlockchainStore from "stores/BlockchainStore";
import AltContainer from "alt/AltContainer";
import Markets from "./Markets";

class MarketsContainer extends React.Component {

    render() {

        return (
              <AltContainer 
                  stores={[MarketsStore, AssetStore]}
                  inject={{
                    markets: () => {
                        return MarketsStore.getState().markets;
                    },
                    assets: () => {
                        return AssetStore.getState().assets;
                    }
                  }} 
                  >
                <Markets/>
              </AltContainer>
        );
    }
}

export default MarketsContainer;
