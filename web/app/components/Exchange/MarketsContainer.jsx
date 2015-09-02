import React from "react";
import MarketsStore from "stores/MarketsStore";
import AssetStore from "stores/AssetStore";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt/AltContainer";
import Markets from "./Markets";

class MarketsContainer extends React.Component {

    render() {

        return (
              <AltContainer 
                  stores={[MarketsStore, AssetStore, SettingsStore]}
                  inject={{
                    markets: () => {
                        return MarketsStore.getState().markets;
                    },
                    baseAsset: () => {
                        return MarketsStore.getState().baseAsset;
                    },
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    settings: () => {
                        return SettingsStore.getState().settings;
                    }
                  }} 
                  >
                <Markets/>
              </AltContainer>
        );
    }
}

export default MarketsContainer;
