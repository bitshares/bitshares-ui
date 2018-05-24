import React from "react";
import {FormattedNumber} from "react-intl";
import AssetWrapper from "./AssetWrapper";
import {connect} from "alt-react";
import MarketsStore from "stores/MarketsStore";
import ReactTooltip from "react-tooltip";
import {MarketStats} from "../Utility/MarketPrice";

/**
 *  Displays change in market value for an asset
 *
 *  Expects three properties
 *  -'quote' which should be a asset id
 *  -'base' which is the asset id of the original asset amount
 */

class MarketChangeComponent extends MarketStats {
    static defaultProps = {
        fullPrecision: false,
        noDecimals: false,
        hide_asset: false
    };

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        ReactTooltip.rebuild();
    }

    shouldComponentUpdate(np) {
        return super.shouldComponentUpdate(np) || np.base !== this.props.base;
    }

    getValue() {
        let {marketStats} = this.props;
        return marketStats && marketStats.change ? marketStats.change : 0;
    }

    render() {
        let marketChangeValue = this.getValue();
        let dayChangeClass =
            parseFloat(marketChangeValue) === 0
                ? ""
                : parseFloat(marketChangeValue) < 0
                    ? "change-down"
                    : "change-up";
        let marketChangeFormattedValue = (
            <FormattedNumber
                style="decimal"
                value={marketChangeValue}
                minimumFractionDigits={2}
                maximumFractionDigits={2}
            />
        );

        return (
            <span className={"value " + dayChangeClass}>
                {marketChangeFormattedValue}%
            </span>
        );
    }
}
MarketChangeComponent = AssetWrapper(MarketChangeComponent, {
    propNames: ["quote", "base"],
    defaultProps: {quote: "1.3.0"}
});

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
    getProps(props) {
        // console.log("allMarketStats:", MarketsStore.getState().allMarketStats.toJS());
        return {
            marketStats: MarketsStore.getState().allMarketStats.get(
                props.marketId
            ),
            allMarketStats: MarketsStore.getState().allMarketStats
        };
    }
});

export {Market24HourChangeComponent};
