import React from "react";
import MarketsStore from "stores/MarketsStore";
import AssetStore from "stores/AssetStore";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt/AltContainer";
import Exchange from "./Exchange";

class MarketsContainer extends React.Component {

    render() {
        let market = this.context.router.getCurrentParams().marketID.split("_");
        
        return (
              <AltContainer 
                  stores={[MarketsStore, AccountStore, AssetStore]}
                  inject={{
                    limit_orders: () => {
                        return MarketsStore.getState().activeMarketLimits;
                    },
                    short_orders: () => {
                        return MarketsStore.getState().activeMarketShorts;
                    },
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    asset_symbol_to_id: () => {
                        return AssetStore.getState().asset_symbol_to_id;
                    },
                    account: () => {
                        return AccountStore.getState().currentAccount;
                    }
                  }} 
                  >
                <Exchange quoteSymbol={market[0]} baseSymbol={market[1]}/>
              </AltContainer>
        );
    }
}

MarketsContainer.contextTypes = { router: React.PropTypes.func.isRequired };

export default MarketsContainer;
