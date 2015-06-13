import React from "react";
import MarketsStore from "stores/MarketsStore";
import AssetStore from "stores/AssetStore";
import AccountStore from "stores/AccountStore";
import AltContainer from "alt/AltContainer";
import Exchange from "./Exchange";
import utils from "common/utils";

class MarketsContainer extends React.Component {

    render() {
        let assets = AssetStore.getState().assets

        let symbols = this.context.router.getCurrentParams().marketID.split("_");
        let quote = { symbol: symbols[0] };
        quote.id = AssetStore.getState().asset_symbol_to_id[quote.symbol];
        quote.precision = utils.get_asset_precision(assets.get(quote.id).precision);

        let base = { symbol: symbols[1] };
        base.id = AssetStore.getState().asset_symbol_to_id[base.symbol],
        base.precision = utils.get_asset_precision(assets.get(base.id).precision);

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
                        return assets;
                    },
                    account: () => {
                        return AccountStore.getState().currentAccount;
                    }
                  }} 
                  >
                <Exchange quote={quote} base={base}/>
              </AltContainer>
        );
    }
}

MarketsContainer.contextTypes = { router: React.PropTypes.func.isRequired };

export default MarketsContainer;
