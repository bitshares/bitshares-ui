import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import Link from "react-router";

@BindToChainState()
class MarketRow extends React.Component {

    static propTypes = {
        quote: ChainTypes.ChainAsset.isRequired,
        base: ChainTypes.ChainAsset.isRequired
    }

    static contextTypes = {router: React.PropTypes.func.isRequired};

    _onClick(marketID) {
        this.context.router.transitionTo("exchange", {marketID: marketID});
    }

    render() {
        let {quote, base} = this.props;
        let core = ChainStore.getAsset("1.3.0");
        let marketID = quote.get("symbol") + "_" + base.get("symbol");
        let marketName = quote.get("symbol") + " : " + base.get("symbol");
        let dynamic_data = quote.get("dynamic");
        let base_dynamic_data = base.get("dynamic");
        let rate, convert = {}, invert, decimals, basePrice, quotePrice;
        if (quote.get("id") !== "1.3.0" && base.get("id") !== "1.3.0") {
            rate = quote.getIn(["options", "core_exchange_rate"]);

            basePrice = utils.get_asset_price(
                base.getIn(["options", "core_exchange_rate", "quote", "amount"]),
                core,
                base.getIn(["options", "core_exchange_rate", "base", "amount"]),
                base
            );

            convert.quoteAmount = utils.get_asset_precision(base.get("precision")) * rate.getIn(["quote", "amount"]) / utils.get_asset_precision(core.get("precision")) / basePrice;
            convert.id = base.getIn(["options", "core_exchange_rate", "base", "asset_id"]);
            invert = true;
        } else if (quote.get("id") === "1.3.0") {
            rate = base.getIn(["options", "core_exchange_rate"]);
            invert = false;
            convert = false;
        } else {
            rate = quote.getIn(["options", "core_exchange_rate"]);
            invert = true;
            decimals = 2;
            convert = false;
        }

        return (
            <tr key={"tr_" + marketID}>
                <td onClick={this._onClick.bind(this, marketID)}>
                    <div className="button outline">{marketName}</div>
                </td>
                <td>
                    <FormattedPrice
                        style={{fontWeight: "bold"}}
                        quote_amount={convert ? convert.quoteAmount : rate.getIn(["quote", "amount"])}
                        quote_asset={convert ? convert.id : rate.getIn(["quote", "asset_id"])}
                        base_amount={rate.getIn(["base", "amount"])}
                        base_asset={rate.getIn(["base", "asset_id"])}
                        invert={invert}
                        decimals={decimals}
                    />
                </td>
                <td>
                    {dynamic_data ? <FormattedAsset
                        style={{fontWeight: "bold"}}
                        amount={parseInt(dynamic_data.get("current_supply"), 10)}
                        asset={quote.get("id")}/> : null}
                </td>
                <td>
                    {base_dynamic_data ? <FormattedAsset
                        style={{fontWeight: "bold"}}
                        amount={parseInt(base_dynamic_data.get("current_supply"), 10)}
                        asset={base.get("id")}/> : null}
                </td>
                <td className="clickable" onClick={this.props.removeMarket}>
                    <span style={{marginBottom: "6px", marginRight: "6px", zIndex:999,  }} className="text float-right remove">–</span>
                </td>
            </tr>
        );
    }
}

export default MarketRow;
