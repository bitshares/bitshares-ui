import React from "react";
import utils from "common/utils";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import AltContainer from "alt-container";
import SettingsStore from "stores/SettingsStore";
import FormattedPrice from "./FormattedPrice";
import MarketsActions from "actions/MarketsActions";
import MarketsStore from "stores/MarketsStore";
import Immutable from "immutable";

export class MarketStatsCheck extends React.Component {

    constructor() {
        super();

        this.fromStatsIntervals = {};
        this.toStatsInterval = null;
    }

    _checkStats(newStats = {close: {}}, oldStats = {close: {}}) {
        return (
            newStats.volumeBase !== oldStats.volumeBase ||
            !utils.are_equal_shallow(newStats.close && newStats.close.base, oldStats.close && oldStats.close.base) ||
            !utils.are_equal_shallow(newStats.close && newStats.close.quote, oldStats.close && oldStats.close.quote)
        );
    }

    componentWillMount() {
        this._startUpdates(this.props);
    }

    componentWillReceiveProps(np) {
        if (!Immutable.is(np.toAsset, this.props.toAsset)) {
            this._stopUpdates();

            this._startUpdates(np);
        }
    }

    _startUpdates(props) {
        let {coreAsset, fromAssets, fromAsset} = props;
        if (coreAsset) {
            if (!fromAssets && fromAsset) fromAssets = [fromAsset];

            // From assets
            fromAssets.forEach(asset => {
                if (asset && asset.get("id") !== coreAsset.get("id")) {
                    setTimeout(() => {
                        MarketsActions.getMarketStats(coreAsset, asset);
                        this.fromStatsIntervals[asset.get("id")] = setInterval(MarketsActions.getMarketStats.bind(this, coreAsset, asset), 5 * 60 * 1000);
                    }, 50);
                }
            });

            if (props.toAsset.get("id") !== coreAsset.get("id")) {
                // wrap this in a timeout to prevent dispatch in the middle of a dispatch
                MarketsActions.getMarketStats.defer(coreAsset, props.toAsset);
                this.toStatsInterval = setInterval(() => {
                    MarketsActions.getMarketStats.defer(coreAsset, props.toAsset);
                }, 5 * 60 * 1000);
            }
        }
    }

    _stopUpdates() {
        for (let key in this.fromStatsIntervals) {
            clearInterval(this.fromStatsIntervals[key]);
        }
        clearInterval(this.toStatsInterval);
    }

    componentWillUnmount() {
        this._stopUpdates();
    }

    shouldComponentUpdate(np) {
        let {fromAsset, fromAssets} = this.props;
        const toMarket = np.toAsset.get("symbol") + "_" + np.coreAsset.get("symbol");
        if (!fromAssets && fromAsset) fromAssets = [fromAsset];
        const fromMarkets = fromAssets.map(asset => {
            if (!asset) return null;
            return asset.get("symbol") + "_" + np.coreAsset.get("symbol");
        }).filter(a => !!a);

        const fromCheck = fromMarkets.reduce((a, b) => {
            return a || this._checkStats(np.marketStats.get(b), this.props.marketStats.get(b));
        }, false);

        return (
            this._checkStats(np.marketStats.get(toMarket), this.props.marketStats.get(toMarket)) ||
            fromCheck
        );
    }
}

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

    constructor(props) {
        super(props);
    }

    componentD

    shouldComponentUpdate(np, nextState) {
        return (
            super.shouldComponentUpdate(np) ||
            np.base_amount !== this.props.base_amount ||
            np.quote_amount !== this.props.quote_amount ||
            np.decimals !== this.props.decimals ||
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
