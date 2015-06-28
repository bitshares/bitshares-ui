import React from "react";
import MarketsStore from "stores/MarketsStore";
import AssetStore from "stores/AssetStore";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt/AltContainer";
import Exchange from "./Exchange";

class ExchangeContainer extends React.Component {

    render() {
        let symbols = this.context.router.getCurrentParams().marketID.split("_");

        return (
                <AltContainer 
                  stores={[MarketsStore, AccountStore, AssetStore]}
                  inject={{
                    limit_orders: () => {
                        return MarketsStore.getState().activeMarketLimits;
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
                    flat_asks: () => {
                        return MarketsStore.getState().flat_asks;
                    },
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    asset_symbol_to_id: () => {
                        return AssetStore.getState().asset_symbol_to_id;
                    },
                    account: () => {
                        return AccountStore.getState().currentAccount;
                    },
                    balances: () => {
                        return AccountStore.getState().balances;
                    }
                  }} 
                  >
                <Exchange quote={symbols[0]} base={symbols[1]}/>
                </AltContainer>
        );
    }
}

ExchangeContainer.contextTypes = { router: React.PropTypes.func.isRequired };

export default ExchangeContainer;
