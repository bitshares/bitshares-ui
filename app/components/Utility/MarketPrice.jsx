import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import cnames from "classnames";
import MarketsActions from "actions/MarketsActions";
import MarketsStore from "stores/MarketsStore";
import { connect } from "alt-react";
import utils from "common/utils";
import FormattedPrice from "./FormattedPrice";

class MarketStats extends React.Component {
    constructor() {
        super();

        this.statsInterval = null;
    }

    _checkStats(newStats = {close: {}}, oldStats = {close: {}}) {
        return (
            newStats.volumeBase !== oldStats.volumeBase ||
            !utils.are_equal_shallow(newStats.close && newStats.close.base, oldStats.close && oldStats.close.base) ||
            !utils.are_equal_shallow(newStats.close && newStats.close.quote, oldStats.close && oldStats.close.quote)
        );
    }

    shouldComponentUpdate(np) {
        return (
            this._checkStats(np.marketStats, this.props.marketStats) ||
            np.base.get("id") !== this.props.base.get("id") ||
            np.quote.get("id") !== this.props.quote.get("id")
        );
    }

    componentWillMount() {
        MarketsActions.getMarketStats.defer(this.props.quote, this.props.base);
        this.statsChecked = new Date();
        this.statsInterval = setInterval(MarketsActions.getMarketStats.bind(this, this.props.quote, this.props.base), 35 * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.statsInterval);
    }
}

class MarketPriceInner extends MarketStats {

    static propTypes = {
        quote: ChainTypes.ChainAsset.isRequired,
        base: ChainTypes.ChainAsset.isRequired,
        invert: React.PropTypes.bool
    };

    static defaultProps = {
        invert: true
    };

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(np) {
        return (
            super.shouldComponentUpdate(np)
        );
    }

    render() {
        let {marketStats, marketStatsInverted, invert} = this.props;
        let price = marketStats && marketStats.price ? marketStats.price : null;
        if (!price && marketStatsInverted && marketStatsInverted.price) {
            price = marketStatsInverted.price.invert();
        }

        return (
            <span className={cnames("", this.props.className)}>
                {price ?
                    <FormattedPrice
                        base_amount={price.base.amount} base_asset={price.base.asset_id}
                        quote_amount={price.quote.amount} quote_asset={price.quote.asset_id}
                        hide_symbols
                        invert={invert}
                    />
                    : "n/a"
                }
            </span>
        );
    }
}

MarketPriceInner = BindToChainState(MarketPriceInner);

class MarketPrice extends React.Component {
    render() {
        return (
            <MarketPriceInner {...this.props} />
        );
    }
}

MarketPrice = connect(MarketPrice, {
    listenTo() {
        return [MarketsStore];
    },
    getProps(props) {
        let invertedId = props.marketId.split("_")[1] + "_" + props.marketId.split("_")[0];
        return {
            marketStats: MarketsStore.getState().allMarketStats.get(props.marketId),
            marketStatsInverted: MarketsStore.getState().allMarketStats.get(invertedId)
        };
    }
});

export {
    MarketPrice,
    MarketStats
};
