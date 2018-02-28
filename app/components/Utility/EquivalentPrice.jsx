import React from "react";
import utils from "common/utils";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import AltContainer from "alt-container";
import SettingsStore from "stores/SettingsStore";
import FormattedPrice from "./FormattedPrice";
import MarketStatsCheck from "./MarketStatsCheck";
import MarketsStore from "stores/MarketsStore";
import MarketUtils from "common/market_utils";

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
        MarketUtils.getFinalPrice(coreAsset, fromAsset, toAsset, marketStats, real);
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
