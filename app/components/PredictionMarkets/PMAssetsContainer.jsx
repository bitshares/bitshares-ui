import React from "react";
import AssetStore from "stores/AssetStore";
import MarketsStore from "stores/MarketsStore";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt-container";
import PredictionMarkets from "./PredictionMarkets";
import BindToChainState from "../Utility/BindToChainState";

class PMAssetsContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[AssetStore, AccountStore, MarketsStore]}
                inject={{
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    markets: () => {
                        return MarketsStore.getState().marketData;
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
                    },
                    marketLimitOrders: () => {
                        return MarketsStore.getState().marketLimitOrders;
                    }
                }}
            >
                <PredictionMarkets />
            </AltContainer>
        );
    }
}

PMAssetsContainer = BindToChainState(PMAssetsContainer, {
    show_loader: true
});

export default PMAssetsContainer;
