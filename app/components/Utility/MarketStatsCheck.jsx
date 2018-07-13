import React from "react";
import MarketsActions from "actions/MarketsActions";
import marketUtils from "common/market_utils";
import utils from "common/utils";

class MarketStatsCheck extends React.Component {
    constructor() {
        super();
        this.fromStatsIntervals = {};
        this.directStatsIntervals = {};
        this.toStatsInterval = null;
    }

    _statsChanged(newStats = {}, oldStats = {}) {
        if (!newStats.price) return false;
        else if (!oldStats.price) return true;
        return (
            newStats.volumeBase !== oldStats.volumeBase ||
            !newStats.price.equals(oldStats.price)
        );
    }

    _useDirectMarket(props) {
        const {fromAsset, toAsset, allMarketStats} = props;
        if (!fromAsset) return false;
        const {marketName: directMarket} = marketUtils.getMarketName(
            toAsset,
            fromAsset
        );

        const directStats = allMarketStats.get(directMarket);

        if (directStats && directStats.volumeBase === 0) return false;

        return true;
    }

    _checkDirectMarkets(props) {
        let {fromAssets, fromAsset, toAsset, allMarketStats} = props;
        if (!fromAssets && fromAsset) fromAssets = [fromAsset];

        return fromAssets
            .filter(a => !!a)
            .map(asset => {
                return this._useDirectMarket({
                    fromAsset: asset,
                    toAsset,
                    allMarketStats
                })
                    ? asset.get("symbol")
                    : null;
            })
            .filter(a => !!a);
    }

    componentWillMount() {
        this._startUpdates(this.props);
    }

    componentWillReceiveProps(np) {
        const currentDirectMarkets = this._checkDirectMarkets(this.props);
        const newDirectMarkets = this._checkDirectMarkets(np);
        if (!utils.are_equal_shallow(currentDirectMarkets, newDirectMarkets)) {
            this._startUpdates(np);
        }

        if (
            np.toAsset &&
            this.props.asset &&
            this.props.toAsset.get("symbol") !== np.asset.get("symbol")
        ) {
            this._startUpdates(np);
        }
    }

    _startUpdates(props) {
        /* Only run this every x seconds */
        if (!!this.updatesTimer) return;
        this.updatesTimer = setTimeout(() => {
            this.updatesTimer = null;
        }, 10 * 1000);
        let {coreAsset, fromAssets, fromAsset, toAsset} = props;
        if (!fromAssets && fromAsset) fromAssets = [fromAsset];

        let directMarkets = fromAssets
            .map(asset => {
                let {marketName: directMarket} = marketUtils.getMarketName(
                    props.toAsset,
                    asset
                );
                let useDirectMarket = this._useDirectMarket({
                    toAsset,
                    fromAsset: asset,
                    allMarketStats: props.allMarketStats
                });

                if (useDirectMarket && toAsset.get("id") !== asset.get("id")) {
                    if (!this.directStatsIntervals[directMarket]) {
                        setTimeout(() => {
                            this.directStatsIntervals[
                                directMarket
                            ] = MarketsActions.getMarketStatsInterval(
                                5 * 60 * 1000,
                                asset,
                                toAsset
                            );
                        }, 50);
                    }
                }
                // else if (this.directStatsIntervals[directMarket]) {
                //     console.log(directMarket, "directStatsIntervals exists, clearing");
                //     this.directStatsIntervals[directMarket]();
                // }

                return useDirectMarket ? directMarket : null;
            })
            .filter(a => !!a);

        let indirectAssets = fromAssets.filter(f => {
            let {marketName: directMarket} = marketUtils.getMarketName(
                props.toAsset,
                f
            );

            return directMarkets.indexOf(directMarket) === -1;
        });

        if (coreAsset && indirectAssets.length) {
            // From assets
            indirectAssets.forEach(asset => {
                if (asset && asset.get("id") !== coreAsset.get("id")) {
                    let {marketName} = marketUtils.getMarketName(
                        coreAsset,
                        asset
                    );
                    if (!this.fromStatsIntervals[marketName]) {
                        setTimeout(() => {
                            this.fromStatsIntervals[
                                marketName
                            ] = MarketsActions.getMarketStatsInterval(
                                5 * 60 * 1000,
                                coreAsset,
                                asset
                            );
                        }, 50);
                    }
                }
            });

            // To asset
            if (props.toAsset.get("id") !== coreAsset.get("id")) {
                // wrap this in a timeout to prevent dispatch in the middle of a dispatch
                this.toStatsInterval = MarketsActions.getMarketStatsInterval(
                    5 * 60 * 1000,
                    coreAsset,
                    props.toAsset
                );
            }
        }
    }

    _stopUpdates() {
        for (let key in this.fromStatsIntervals) {
            this.fromStatsIntervals[key]();
            delete this.fromStatsIntervals[key];
        }
        for (let key in this.directStatsIntervals) {
            this.directStatsIntervals[key]();
            delete this.directStatsIntervals[key];
        }
        if (this.toStatsInterval) this.toStatsInterval();
        this.toStatsInterval = null;
    }

    componentWillUnmount() {
        this._stopUpdates();
    }

    shouldComponentUpdate(np) {
        let {fromAsset, fromAssets} = this.props;

        const {marketName: toMarket} = marketUtils.getMarketName(
            np.toAsset,
            np.coreAsset
        );

        if (!fromAssets && fromAsset) fromAssets = [fromAsset];
        function getMarketNames(assets, toAsset) {
            return assets
                .map(asset => {
                    if (!asset) return null;
                    const {marketName} = marketUtils.getMarketName(
                        asset,
                        toAsset
                    );
                    return marketName;
                })
                .filter(a => !!a);
        }

        const directMarkets = getMarketNames(fromAssets, np.toAsset);
        const indirectMarkets = getMarketNames(fromAssets, np.coreAsset);

        const indirectCheck = indirectMarkets.reduce((a, b) => {
            return (
                a ||
                this._statsChanged(
                    np.allMarketStats.get(b),
                    this.props.allMarketStats.get(b)
                )
            );
        }, false);

        const directCheck = directMarkets.reduce((a, b) => {
            return (
                a ||
                this._statsChanged(
                    np.allMarketStats.get(b),
                    this.props.allMarketStats.get(b)
                )
            );
        }, false);

        return (
            this._statsChanged(
                np.allMarketStats.get(toMarket),
                this.props.allMarketStats.get(toMarket)
            ) ||
            indirectCheck ||
            directCheck
        );
    }
}

export default MarketStatsCheck;
