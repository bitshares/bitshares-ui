import React from "react";
import AssetStore from "stores/AssetStore";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt-container";
import Assets from "./Assets";
import Explorer from "./Explorer";

class AssetsContainer extends React.Component {

    render() {
        
        let content = <AltContainer 
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
                    </AltContainer>;
        
        return (<Explorer tab="assets" content={content}/>);
        }
    }

    export default AssetsContainer;
