import React from "react";
import MarketsStore from "stores/MarketsStore";
import AssetStore from "stores/AssetStore";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt/AltContainer";
import AssetActions from "actions/AssetActions";
import Markets from "./Markets";

class MarketsContainer extends React.Component {

    componentDidMount() {
      AssetActions.getAssetList("A", 100);
    }

    render() {

        return (
              <AltContainer 
                  stores={[MarketsStore, AssetStore, SettingsStore]}
                  inject={{
                    markets: () => {
                        return MarketsStore.getState().markets;
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
