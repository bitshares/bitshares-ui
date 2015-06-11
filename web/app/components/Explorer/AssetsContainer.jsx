import React from "react";
import AssetStore from "stores/AssetStore";
import AltContainer from "alt/AltContainer";
import Assets from "./Assets";

class AssetsContainer extends React.Component {

    render() {

        return (
              <AltContainer 
                  stores={[AssetStore]}
                  inject={{
                    assets: () => {
                        return AssetStore.getState().assets;
                    }
                  }} 
                  >
                <Assets/>
              </AltContainer>
        );
    }
}

export default AssetsContainer;
