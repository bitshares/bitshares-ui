import React from "react";
import FormattedAsset from "./FormattedAsset";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import utils from "common/utils";
import MarketsActions from "actions/MarketsActions";
import {ChainStore} from "graphenejs-lib/es";
import { connect } from "alt-react";
import MarketsStore from "stores/MarketsStore";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";

/**
 *  Given an asset amount, displays the equivalent value in baseAsset if possible
 *
 *  Expects three properties
 *  -'toAsset' which should be a asset id
 *  -'fromAsset' which is the asset id of the original asset amount
 *  -'amount' which is the amount to convert
 *  -'fullPrecision' boolean to tell if the amount uses the full precision of the asset
 */

class ValueComponent extends React.Component {

    static propTypes = {
        toAsset: ChainTypes.ChainAsset.isRequired,
        fromAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        toAsset: "1.3.0",
        fullPrecision: true,
        noDecimals: false
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
                // MarketsActions.getMarketStats.bind(this, this.props.toAsset, coreAsset);
                MarketsActions.getMarketStats.defer(coreAsset, this.props.toAsset);
                this.toStatsInterval = setInterval(() => {
                    MarketsActions.getMarketStats.defer(coreAsset, this.props.toAsset);
                }, 5 * 60 * 1000);
            }
        }
    }

    componentWillUnmount() {
        clearInterval(this.fromStatsInterval);
        clearInterval(this.toStatsInterval);
    }

    componentDidMount() {
        ReactTooltip.rebuild();
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

        // console.log("marketStats:", marketStats.toJS());
        if (coreAsset && marketStats) {
            let coreSymbol = coreAsset.get("symbol");
            toStats = marketStats.get(toSymbol + "_" + coreSymbol);
            fromStats = marketStats.get(fromSymbol + "_" + coreSymbol);
        }

        let price = utils.convertPrice(fromStats && fromStats.close ? fromStats.close :
                                        fromID === "1.3.0" || fromAsset.has("bitasset") ? fromAsset : null,
                                        toStats && toStats.close ? toStats.close :
                                        (toID === "1.3.0" || toAsset.has("bitasset")) ? toAsset : null,
                                        fromID,
                                        toID);

        let eqValue = price ? utils.convertValue(price, amount, fromAsset, toAsset) : null;

        if (!eqValue) {
            return <span data-place="left" data-tip={counterpart.translate("tooltip.no_price")} style={{fontSize: "0.9rem"}}><Translate content="account.no_price" /></span>;
        }

        return <FormattedAsset noPrefix amount={eqValue} asset={toID} decimalOffset={toSymbol.indexOf("BTC") !== -1 ? 4 : this.props.noDecimals ? toAsset.get("precision") : 0}/>;
    }
}
ValueComponent = BindToChainState(ValueComponent, {keep_updating: true});

class EquivalentValueComponent extends React.Component {
    render() {
        return <ValueComponent {...this.props} />;
    }
}

EquivalentValueComponent = connect(EquivalentValueComponent, {
    listenTo() {
        return [MarketsStore];
    },
    getProps() {
        return {
            marketStats: MarketsStore.getState().allMarketStats
        };
    }
});

class BalanceValueComponent extends React.Component {

    static propTypes = {
        balance: ChainTypes.ChainObject.isRequired
    }

    render() {
        let amount = Number(this.props.balance.get("balance"));
        let fromAsset = this.props.balance.get("asset_type");

        return <EquivalentValueComponent amount={amount} fromAsset={fromAsset} noDecimals={true} toAsset={this.props.toAsset}/>;
    }
}
BalanceValueComponent = BindToChainState(BalanceValueComponent, {keep_updating: true});
export {EquivalentValueComponent, BalanceValueComponent};
