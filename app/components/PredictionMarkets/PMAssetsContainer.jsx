import React from "react";
import AssetStore from "stores/AssetStore";
import MarketsStore from "stores/MarketsStore";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt-container";
import PredictionMarkets from "./PredictionMarkets";

class PMAssetsContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[AssetStore, AccountStore]}
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
                    },
                    currentAccount: () => {
                        return (
                            AccountStore.getState().currentAccount ||
                            AccountStore.getState().passwordAccount
                        );
                    }
                }}
            >
                <PredictionMarkets />
            </AltContainer>
        );
    }
}

export default PMAssetsContainer;
