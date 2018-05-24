import React from "react";
import FormattedAsset from "./FormattedAsset";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import AssetWrapper from "./AssetWrapper";
import utils from "common/utils";
import {connect} from "alt-react";
import MarketsStore from "stores/MarketsStore";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";
import MarketStatsCheck from "./MarketStatsCheck";
import MarketUtils from "common/market_utils";

/**
 *  Given an asset amount, displays the equivalent value in baseAsset if possible
 *
 *  Expects three properties
 *  -'toAsset' which should be a asset id
 *  -'fromAsset' which is the asset id of the original asset amount
 *  -'amount' which is the amount to convert
 *  -'fullPrecision' boolean to tell if the amount uses the full precision of the asset
 */

class ValueComponent extends MarketStatsCheck {
    static defaultProps = {
        fullPrecision: true,
        noDecimals: false,
        fullDecimals: false,
        hide_asset: false
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
            !utils.are_equal_shallow(np.pulsate, this.props.pulsate) ||
            np.toAsset !== this.props.toAsset ||
            np.fromAsset !== this.props.fromAsset ||
            np.amount !== this.props.amount
        );
    }

    getValue() {
        let {
            amount,
            toAsset,
            fromAsset,
            fullPrecision,
            marketStats,
            coreAsset
        } = this.props;
        return MarketUtils.convertValue(
            amount,
            toAsset,
            fromAsset,
            marketStats,
            coreAsset,
            fullPrecision
        );
    }

    render() {
        let {amount, toAsset, fromAsset, fullPrecision, ...others} = this.props;

        let toID = toAsset.get("id");
        let toSymbol = toAsset.get("symbol");

        if (!fullPrecision) {
            amount = utils.get_asset_amount(amount, fromAsset);
        }

        let eqValue = this.getValue();

        if (!eqValue && eqValue !== 0) {
            return (
                <div
                    className="tooltip inline-block"
                    data-place="bottom"
                    data-tip={counterpart.translate("tooltip.no_price")}
                    style={{fontSize: "0.9rem"}}
                >
                    <Translate content="account.no_price" />
                </div>
            );
        }

        return (
            <FormattedAsset
                noPrefix
                amount={eqValue}
                asset={toID}
                decimalOffset={
                    toSymbol.indexOf("BTC") !== -1
                        ? 4
                        : this.props.fullDecimals
                            ? 0
                            : this.props.noDecimals
                                ? toAsset.get("precision")
                                : toAsset.get("precision") - 2
                }
                {...others}
            />
        );
    }
}
ValueComponent = AssetWrapper(ValueComponent, {
    propNames: ["toAsset", "fromAsset", "coreAsset"],
    defaultProps: {
        toAsset: "1.3.0",
        coreAsset: "1.3.0"
    }
});

class EquivalentValueComponent extends React.Component {
    render() {
        let {refCallback, ...others} = this.props;

        return <ValueComponent {...others} ref={refCallback} />;
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
    };

    render() {
        const {balance, ...others} = this.props;
        const isBalanceObject = !!balance.getIn(["balance", "amount"]);

        let amount = Number(
            isBalanceObject
                ? balance.getIn(["balance", "amount"])
                : balance.get("balance")
        );
        let fromAsset = isBalanceObject
            ? balance.getIn(["balance", "asset_id"])
            : balance.get("asset_type");
        if (isNaN(amount)) return <span>--</span>;
        return (
            <EquivalentValueComponent
                amount={amount}
                fromAsset={fromAsset}
                noDecimals={true}
                {...others}
            />
        );
    }
}
BalanceValueComponent = BindToChainState(BalanceValueComponent, {
    keep_updating: true
});
export {EquivalentValueComponent, BalanceValueComponent};
