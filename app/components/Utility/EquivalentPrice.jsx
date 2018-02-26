import React from "react";
import utils from "common/utils";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import AltContainer from "alt-container";
import SettingsStore from "stores/SettingsStore";
import FormattedPrice from "./FormattedPrice";
import MarketStatsCheck from "./MarketStatsCheck";
import MarketsStore from "stores/MarketsStore";

class EquivalentPrice extends MarketStatsCheck {

    static propTypes = {
        toAsset: ChainTypes.ChainAsset.isRequired,
        fromAsset: ChainTypes.ChainAsset.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        toAsset: "1.3.0",
        coreAsset: "1.3.0",
        forceDirection: true
    }

    shouldComponentUpdate(np, nextState) {
        return (
            super.shouldComponentUpdate(np) ||
            np.base_amount !== this.props.base_amount ||
            np.quote_amount !== this.props.quote_amount ||
            np.decimals !== this.props.decimals ||
            !utils.are_equal_shallow(np.pulsate, this.props.pulsate) ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    getFinalPrice(real = false) {
        const {coreAsset, fromAsset, toAsset, marketStats} = this.props;
        const toMarket = toAsset.get("symbol") + "_" + coreAsset.get("symbol");
        const fromMarket = fromAsset.get("symbol") + "_" + coreAsset.get("symbol");
        let toPrice, fromPrice;
        if (marketStats.get(fromMarket) && marketStats.get(fromMarket).price) {
            fromPrice = marketStats.get(fromMarket).price.clone();
        }
        if (marketStats.get(toMarket) && marketStats.get(toMarket).price) {
            toPrice = marketStats.get(toMarket).price.clone();
        }

        if (toAsset.get("id") === fromAsset.get("id")) return 1;

        let finalPrice;
        if (toPrice && fromPrice) {
            finalPrice = toPrice.times(fromPrice);
        } else if (toPrice) {
            finalPrice = toPrice;
        } else  if (fromPrice) {
            finalPrice = fromPrice;
        }
        if (!finalPrice) return null;
        const finalId = finalPrice.base.asset_id + "_" + finalPrice.quote.asset_id;
        if (
            finalId.indexOf(toAsset.get("id")) === -1 ||
            finalId.indexOf(fromAsset.get("id")) === -1) {
            return null;
        }
        if (real) return finalPrice.toReal();
        return finalPrice;
    }

    render() {
        const { toAsset, forceDirection, ...others} = this.props;

        const finalPrice = this.getFinalPrice();

        if (finalPrice === 1) {
            return <span>1.00</span>;
        }

        if (!finalPrice) return <span>--</span>;

        return (
            <FormattedPrice
                force_direction={forceDirection ? toAsset.get("symbol") : false}
                base_amount={finalPrice.base.amount}
                base_asset={finalPrice.base.asset_id}
                quote_amount={finalPrice.quote.amount}
                quote_asset={finalPrice.quote.asset_id}
                {...others}
            />
        );
    }
}

EquivalentPrice = BindToChainState(EquivalentPrice);

export default class EquivalentPriceWrapper extends React.Component {

    render() {
        return (
          <AltContainer
            stores={[SettingsStore, MarketsStore]}
            inject={{
                toAsset: () => {
                    return this.props.toAsset || SettingsStore.getState().settings.get("unit", "1.3.0");
                },
                marketStats: () => {
                    return MarketsStore.getState().allMarketStats;
                }
            }}
          >
            <EquivalentPrice
                {...this.props}
                ref={this.props.refCallback}
            />
          </AltContainer>
        );
    }
}
