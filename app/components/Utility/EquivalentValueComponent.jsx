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
import MarketStatsCheck from "./MarketStatsCheck";
import MarketUtils from "common/market_utils";
import {Tooltip} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";
import {ChainStore} from "bitsharesjs";

const getEquivalentValue = function(
    amount,
    toAsset,
    fromAsset,
    fullPrecision = null,
    coreAsset = null,
    allMarketStats = null
) {
    try {
        return MarketUtils.convertValue(
            amount,
            toAsset,
            fromAsset,
            allMarketStats
                ? allMarketStats
                : MarketsStore.getState().allMarketStats,
            coreAsset ? coreAsset : ChainStore.getAsset("1.3.0"),
            fullPrecision ? fullPrecision : true
        );
    } catch (err) {
        console.log(err);
    }
};

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

    shouldComponentUpdate(np) {
        return (
            super.shouldComponentUpdate(np) ||
            !utils.are_equal_shallow(np.pulsate, this.props.pulsate) ||
            np.toAsset !== this.props.toAsset ||
            np.fromAsset !== this.props.fromAsset ||
            np.amount !== this.props.amount
        );
    }

    render() {
        let {
            amount,
            toAsset,
            fromAsset,
            fullPrecision,
            coreAsset,
            ...others
        } = this.props;

        let toID = toAsset.get("id");
        let toSymbol = toAsset.get("symbol");

        let eqValue = getEquivalentValue(
            amount,
            toAsset,
            fromAsset,
            fullPrecision,
            coreAsset
        );

        if (!eqValue && eqValue !== 0) {
            return (
                <Tooltip
                    placement="bottom"
                    title={counterpart.translate("tooltip.no_price")}
                >
                    <div
                        className="tooltip inline-block"
                        style={{fontSize: "0.9rem"}}
                    >
                        <Translate content="account.no_price" />
                    </div>
                </Tooltip>
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

EquivalentValueComponent = connect(
    EquivalentValueComponent,
    {
        listenTo() {
            return [MarketsStore];
        },
        getProps() {
            return {
                allMarketStats: MarketsStore.getState().allMarketStats
            };
        }
    }
);

const balanceToAsset = function(balance) {
    const isBalanceObject = balance.getIn(["balance", "amount"]);
    if (isBalanceObject || isBalanceObject === 0) {
        return {
            asset_id: balance.getIn(["balance", "asset_id"]),
            amount: Number(balance.getIn(["balance", "amount"]))
        };
    } else {
        return {
            asset_id: balance.get("asset_type"),
            amount: Number(balance.get("balance"))
        };
    }
};

class BalanceValueComponent extends React.Component {
    static propTypes = {
        balance: ChainTypes.ChainObject.isRequired,
        satoshis: PropTypes.number
    };

    static defaultProps = {
        satoshis: null
    };

    render() {
        const {balance, ...others} = this.props;
        const balanceAsset = balanceToAsset(balance);
        let amount = balanceAsset.amount;
        // override amount if desired
        if (!!this.props.satoshis) {
            amount = this.props.satoshis;
        }
        let fromAsset = balanceAsset.asset_id;
        if (isNaN(amount)) return <span>--</span>;
        return (
            <EquivalentValueComponent
                amount={amount}
                fromAsset={fromAsset}
                noDecimals={true}
                fullPrecision={
                    !!this.props.satoshis ? false : this.props.fullPrecision
                }
                {...others}
            />
        );
    }
}
BalanceValueComponent = BindToChainState(BalanceValueComponent, {
    keep_updating: true
});

export {
    EquivalentValueComponent,
    BalanceValueComponent,
    balanceToAsset,
    getEquivalentValue
};
