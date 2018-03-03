import React from "react";
import utils from "common/utils";
import MarketsActions from "actions/MarketsActions";
import Immutable from "immutable";

class MarketStatsCheck extends React.Component {
    constructor() {
        super();

        this.fromStatsIntervals = {};
        this.toStatsInterval = null;
    }

    _checkStats(newStats = {close: {}}, oldStats = {close: {}}) {
        return (
            newStats.volumeBase !== oldStats.volumeBase ||
            !utils.are_equal_shallow(
                newStats.close && newStats.close.base,
                oldStats.close && oldStats.close.base
            ) ||
            !utils.are_equal_shallow(
                newStats.close && newStats.close.quote,
                oldStats.close && oldStats.close.quote
            )
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
                        this.fromStatsIntervals[asset.get("id")] = setInterval(
                            MarketsActions.getMarketStats.bind(
                                this,
                                coreAsset,
                                asset
                            ),
                            5 * 60 * 1000
                        );
                    }, 50);
                }
            });

            if (props.toAsset.get("id") !== coreAsset.get("id")) {
                // wrap this in a timeout to prevent dispatch in the middle of a dispatch
                MarketsActions.getMarketStats(coreAsset, props.toAsset);
                this.toStatsInterval = setInterval(() => {
                    MarketsActions.getMarketStats(coreAsset, props.toAsset);
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
        const toMarket =
            np.toAsset.get("symbol") + "_" + np.coreAsset.get("symbol");
        if (!fromAssets && fromAsset) fromAssets = [fromAsset];
        const fromMarkets = fromAssets
            .map(asset => {
                if (!asset) return null;
                return asset.get("symbol") + "_" + np.coreAsset.get("symbol");
            })
            .filter(a => !!a);

        const fromCheck = fromMarkets.reduce((a, b) => {
            return (
                a ||
                this._checkStats(
                    np.marketStats.get(b),
                    this.props.marketStats.get(b)
                )
            );
        }, false);

        return (
            this._checkStats(
                np.marketStats.get(toMarket),
                this.props.marketStats.get(toMarket)
            ) || fromCheck
        );
    }
}

export default MarketStatsCheck;
