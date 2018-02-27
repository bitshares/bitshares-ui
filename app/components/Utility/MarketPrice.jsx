import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import cnames from "classnames";
import MarketsActions from "actions/MarketsActions";
import MarketsStore from "stores/MarketsStore";
import { connect } from "alt-react";
import utils from "common/utils";
import FormattedPrice from "./FormattedPrice";
import marketUtils from "common/market_utils";

class MarketStats extends React.Component {
    constructor(props) {
        super();

        this.statsInterval = null;
        const {marketID, first, second} = marketUtils.getMarketID(props.base, props.quote);
        this.state = {
            marketID,
            first,
            second
        };
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
            this._checkStats(np.allMarketStats.get(this.state.marketID), this.props.allMarketStats.get(this.state.marketID)) ||
            np.base.get("id") !== this.props.base.get("id") ||
            np.quote.get("id") !== this.props.quote.get("id")
        );
    }

    componentWillMount() {
        MarketsActions.getMarketStats.defer(this.state.second, this.state.first);
        this.statsChecked = new Date();
        this.statsInterval = setInterval(MarketsActions.getMarketStats.bind(this, this.state.second, this.state.first), 35 * 1000);
    }

    componentWillUnmount() {
        clearInterval(this.statsInterval);
    }
}

class MarketPriceInner extends MarketStats {

    static propTypes = {
        quote: ChainTypes.ChainAsset.isRequired,
        base: ChainTypes.ChainAsset.isRequired
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
        let {allMarketStats} = this.props;
        const {marketID} = this.state;
        const marketStats = allMarketStats.get(marketID);
        let price = marketStats && marketStats.price ? marketStats.price : null;
        // if (!price && marketStatsInverted && marketStatsInverted.price) {
        //     price = marketStatsInverted.price.invert();
        // }

        return (
            <span className={cnames("", this.props.className)}>
                {price ?
                    <FormattedPrice
                        base_amount={price.base.amount} base_asset={price.base.asset_id}
                        quote_amount={price.quote.amount} quote_asset={price.quote.asset_id}
                        force_direction={this.props.force_direction}
                        hide_symbols={this.props.hide_symbols}
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
    getProps() {
        return {
            allMarketStats: MarketsStore.getState().allMarketStats
        };
    }
});

export {
    MarketPrice,
    MarketStats
};
