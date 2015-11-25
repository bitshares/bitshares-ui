import React from "react";
import AssetStore from "stores/AssetStore";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt/AltContainer";
import Assets from "./Assets";

class AssetsContainer extends React.Component {

    render() {

        return (
              <AltContainer 
                  stores={[AssetStore, SettingsStore]}
                  inject={{
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    filterMPA: () => {
                        return SettingsStore.getState().viewSettings.get("filterMPA");
                    },
                    filterUIA: () => {
                        return SettingsStore.getState().viewSettings.get("filterUIA");
                    }
                  }} 
                  >
                <Assets/>
              </AltContainer>
        );
    }
}

export default AssetsContainer;
