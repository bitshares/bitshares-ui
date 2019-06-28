import React from "react";
import AssetStore from "stores/AssetStore";
import MarketsStore from "stores/MarketsStore";
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
                    },
                    markets: () => {
                        const data = MarketsStore.getState().marketData;
                        console.log(data);
                        return data;
                    },
                    bucketSize: () => {
                        return MarketsStore.getState().bucketSize;
                    },
                    currentGroupOrderLimit: () => {
                        return MarketsStore.getState().currentGroupLimit;
                    }
                }}
            >
                <PredictionMarkets />
            </AltContainer>
        );
    }
}

export default PMAssetsContainer;
