import React from "react";
import FormattedAsset from "./FormattedAsset";
import {FormattedNumber} from "react-intl";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import utils from "common/utils";
import { connect } from "alt-react";
import MarketsStore from "stores/MarketsStore";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";
import {MarketStatsCheck} from "../Utility/EquivalentPrice";

/**
 *  Displays change in market value for an asset
 *
 *  Expects three properties
 *  -'toAsset' which should be a asset id
 *  -'fromAsset' which is the asset id of the original asset amount
 *  -'amount' which is the amount to convert
 *  -'fullPrecision' boolean to tell if the amount uses the full precision of the asset
 */

class MarketChangeComponent extends MarketStatsCheck {

    static propTypes = {
        toAsset: ChainTypes.ChainAsset.isRequired,
        fromAsset: ChainTypes.ChainAsset.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        toAsset: "1.3.0",
        fullPrecision: false,
        noDecimals: false,
        hide_asset: false,
        coreAsset: "1.3.0"
    };

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        ReactTooltip.rebuild();
    }

    shouldComponentUpdate(np) {
        return (
            super.shouldComponentUpdate(np) ||
            np.fromAsset !== this.props.fromAsset
        );
    }

    getValue() {
        let {fromAsset, marketStats, coreAsset} = this.props;
        let fromStats;
        let fromSymbol = fromAsset.get("symbol");

        if (coreAsset && marketStats) {
            let coreSymbol = coreAsset.get("symbol");
            fromStats = marketStats.get(fromSymbol + "_" + coreSymbol);
        }

        return fromStats && fromStats.change ? fromStats.change : 0;
    }

    render() {
        let {fromAsset} = this.props;

        let marketChangeValue = this.getValue();
        let dayChangeClass = parseFloat(marketChangeValue) === 0 ? "" : parseFloat(marketChangeValue) < 0 ? "negative" : "positive";
        let marketChangeFormattedValue = <FormattedNumber 
            style='decimal'
            value={marketChangeValue}
            minimumFractionDigits={2}
            maximumFractionDigits={2}
        />;

        return <span className={"value " + dayChangeClass}>{marketChangeFormattedValue}%</span>;
    }
}
MarketChangeComponent = BindToChainState(MarketChangeComponent, {keep_updating: true});

class Market24HourChangeComponent extends React.Component {
    render() {
        let {refCallback, ...others} = this.props;

        return <MarketChangeComponent {...others} ref={refCallback} />;
    }
}

Market24HourChangeComponent = connect(Market24HourChangeComponent, {
    listenTo() {
        return [MarketsStore];
    },
    getProps() {
        return {
            marketStats: MarketsStore.getState().allMarketStats
        };
    }
});

export {Market24HourChangeComponent};
