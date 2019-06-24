import React from "react";
import AssetStore from "stores/AssetStore";
import AltContainer from "alt-container";
import PredictionMarkets from "./PredictionMarkets";
import assetUtils from "common/asset_utils";

class PMAssetsContainer extends React.Component {
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
                <PredictionMarkets />
            </AltContainer>
        );
    }
}

export default PMAssetsContainer;
