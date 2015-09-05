import React from "react";
import MarketsStore from "stores/MarketsStore";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt/AltContainer";
import Exchange from "./Exchange";

class ExchangeContainer extends React.Component {

    render() {
        let symbols = this.context.router.getCurrentParams().marketID.split("_");

        return (
                <AltContainer 
                  stores={[MarketsStore, AccountStore, SettingsStore]}
                  inject={{
                    limit_orders: () => {
                        return MarketsStore.getState().activeMarketLimits;
                    },
                    bids: () => {
                        return MarketsStore.getState().bids;
                    },
                    asks: () => {
                        return MarketsStore.getState().asks;
                    },
                    call_orders: () => {
                        return MarketsStore.getState().activeMarketCalls;
                    },
                    settle_orders: () => {
                        return MarketsStore.getState().activeMarketSettles;
                    },
                    flat_bids: () => {
                        return MarketsStore.getState().flat_bids;
                    },
                    totalBids: () => {
                        return MarketsStore.getState().totalBids;
                    },
                    flat_asks: () => {
                        return MarketsStore.getState().flat_asks;
                    },
                    priceData: () => {
                        return MarketsStore.getState().priceData;
                    },
                    volumeData: () => {
                        return MarketsStore.getState().volumeData;
                    },
                    activeMarketHistory: () => {
                        return MarketsStore.getState().activeMarketHistory;
                    },
                    bucketSize: () => {
                        return MarketsStore.getState().bucketSize;
                    },
                    currentAccount: () => {
                        return AccountStore.getState().currentAccount;
                    },
                    settings: () => {
                        return SettingsStore.getState().settings;
                    }
                  }} 
                  >
                    <Exchange quoteAsset={symbols[0]} baseAsset={symbols[1]} />
                </AltContainer>
        );
    }
}

ExchangeContainer.contextTypes = { router: React.PropTypes.func.isRequired };

export default ExchangeContainer;
