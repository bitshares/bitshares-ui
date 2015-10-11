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
                  stores={[SettingsStore, AssetStore, MarketsStore]}
                  inject={{
                    defaultMarkets: () => {
                        return SettingsStore.getState().defaultMarkets;
                    },
                    searchTerms: () => {
                        return AssetStore.getState().searchTerms;
                    },
                    lookupResults: () => {
                        return AssetStore.getState().lookupResults;
                    },
                    marketBase: () => {
                        return MarketsStore.getState().marketBase;
                    }
                  }} 
                  >
                <Markets/>
              </AltContainer>
        );
    }
}

export default MarketsContainer;
