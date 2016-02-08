import React from "react";
import FormattedAsset from "./FormattedAsset";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import utils from "common/utils";
import MarketsActions from "actions/MarketsActions";
import ChainStore from "api/ChainStore";
import connectToStores from "alt/utils/connectToStores";
import MarketsStore from "stores/MarketsStore";

/**
 *  Given an asset amount, displays the equivalent value in baseAsset if possible
 *
 *  Expects three properties
 *  -'toAsset' which should be a asset id
 *  -'fromAsset' which is the asset id of the original asset amount
 *  -'amount' which is the amount to convert
 *  -'fullPrecision' boolean to tell if the amount uses the full precision of the asset
 */

@BindToChainState({keep_updating: true})
class ValueComponent extends React.Component {

    static propTypes = {
        toAsset: ChainTypes.ChainAsset.isRequired,
        fromAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        toAsset: "1.3.0",
        fullPrecision: true
    };

    constructor() {
        super();

        this.fromStatsInterval = null;
        this.toStatsInterval = null;
    }

    componentWillMount() {
        let coreAsset = ChainStore.getAsset("1.3.0");
        if (coreAsset) {
            if (this.props.fromAsset.get("id") !== coreAsset.get("id")) {
                MarketsActions.getMarketStats(coreAsset, this.props.fromAsset);
                this.fromStatsInterval = setInterval(MarketsActions.getMarketStats.bind(this, coreAsset, this.props.fromAsset), 5 * 60 * 1000);
            }
            if (this.props.toAsset.get("id") !== coreAsset.get("id")) {
                // wrap this in a timeout to prevent dispatch in the middle of a dispatch
                setTimeout(() => {
                    MarketsActions.getMarketStats.bind(this, coreAsset, this.props.toAsset);
                    this.toStatsInterval = setInterval(MarketsActions.getMarketStats.bind(this, coreAsset, this.props.toAsset), 5 * 60 * 1000);
                }, 150);
            }
        }
    }

    componentWillUnmount() {
        clearInterval(this.fromStatsInterval);
        clearInterval(this.toStatsInterval);
    }

    getValue() {
        let {amount, toAsset, fromAsset, fullPrecision, marketStats} = this.props;
        let coreAsset = ChainStore.getAsset("1.3.0");
        let toStats, fromStats;

        let toID = toAsset.get("id");
        let toSymbol = toAsset.get("symbol");
        let fromID = fromAsset.get("id");
        let fromSymbol = fromAsset.get("symbol");

        if (!fullPrecision) {
            amount = utils.get_asset_amount(amount, fromAsset);
        }

        if (coreAsset && marketStats) {
            let coreSymbol = coreAsset.get("symbol");

            toStats = marketStats.get(toSymbol + "_" + coreSymbol);
            fromStats = marketStats.get(fromSymbol + "_" + coreSymbol);
        }

        let price = utils.convertPrice(fromStats && fromStats.close ? fromStats.close : fromAsset, toStats && toStats.close ? toStats.close : toAsset, fromID, toID);

        return utils.convertValue(price, amount, fromAsset, toAsset);
    }

    render() {
        let {amount, toAsset, fromAsset, fullPrecision, marketStats} = this.props;
        let coreAsset = ChainStore.getAsset("1.3.0");
        let toStats, fromStats;

        let toID = toAsset.get("id");
        let toSymbol = toAsset.get("symbol");
        let fromID = fromAsset.get("id");
        let fromSymbol = fromAsset.get("symbol");

        if (!fullPrecision) {
            amount = utils.get_asset_amount(amount, fromAsset);
        }

        if (coreAsset && marketStats) {
            let coreSymbol = coreAsset.get("symbol");

            toStats = marketStats.get(toSymbol + "_" + coreSymbol);
            fromStats = marketStats.get(fromSymbol + "_" + coreSymbol);
        }

        let price = utils.convertPrice(fromStats && fromStats.close ? fromStats.close : fromID === "1.3.0" ? fromAsset : null, toStats && toStats.close ? toStats.close : toID === "1.3.0" ? toAsset : null, fromID, toID);

        let eqValue = price ? utils.convertValue(price, amount, fromAsset, toAsset) : null;
        if (!eqValue) {
            return <span>n/a</span>
        }

        return <FormattedAsset amount={eqValue} asset={toID} decimalOffset={toAsset.get("precision")}/>;
    }
}

@connectToStores
class ValueStoreWrapper extends React.Component {
    static getStores() {
        return [MarketsStore]
    };

    static getPropsFromStores() {
        return {
            marketStats: MarketsStore.getState().allMarketStats
        }
    };

    render() {
        return <ValueComponent {...this.props} />
    }
}


@BindToChainState({keep_updating: true})
class BalanceValueComponent extends React.Component {

    static propTypes = {
        balance: ChainTypes.ChainObject.isRequired
    }

    render() {
        let amount = Number(this.props.balance.get("balance"));
        let fromAsset = this.props.balance.get("asset_type");
            
        return <ValueStoreWrapper amount={amount} fromAsset={fromAsset} toAsset={this.props.toAsset}/>;
    }
}

ValueStoreWrapper.BalanceValueComponent = BalanceValueComponent;
export default ValueStoreWrapper
