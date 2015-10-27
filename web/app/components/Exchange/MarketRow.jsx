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
        if (!core || !quote || !base) {
            return null;
        }
        let marketID = quote.get("symbol") + "_" + base.get("symbol");
        let marketName = quote.get("symbol") + ":" + base.get("symbol");
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


        let rowStyles = {};
        if (this.props.leftAlign) {
            rowStyles.textAlign = "left";
        }

        let buttonClass = "button outline";
        let buttonStyle = null;
        if (this.props.compact) {
            buttonClass += " no-margin";
            buttonStyle = {marginBottom: 0, fontSize: "0.75rem"}
        }

        let columns = this.props.columns.map(column => {
            switch (column.name) {
                case "marketName":
                    return (
                        <td key={column.index} onClick={this._onClick.bind(this, marketID)}>
                            <div className={buttonClass} style={buttonStyle}>{marketName}</div>
                        </td>
                    );
                    break;

                case "price":
                    return (
                        <td key={column.index}>
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
                    )

                case "quoteSupply":
                    return (
                        <td key={column.index}>
                            {dynamic_data ? <FormattedAsset
                                style={{fontWeight: "bold"}}
                                amount={parseInt(dynamic_data.get("current_supply"), 10)}
                                asset={quote.get("id")}/> : null}
                        </td>
                    );
                    break;

                case "baseSupply":
                    return (
                        <td key={column.index}>
                            {base_dynamic_data ? <FormattedAsset
                            style={{fontWeight: "bold"}}
                            amount={parseInt(base_dynamic_data.get("current_supply"), 10)}
                            asset={base.get("id")}/> : null}
                        </td>
                    );
                    break;

                case "remove":
                    return (
                        <td key={column.index} className="clickable" onClick={this.props.removeMarket}>
                            <span style={{marginBottom: "6px", marginRight: "6px", zIndex:999,  }} className="text float-right remove">–</span>
                        </td>
                    )

                default:
                    break;
            }

        }).sort((a,b) => {
            return a.key > b.key;
        });

        return (
            <tr key={"tr_" + marketID} style={rowStyles}>
                {columns}
            </tr>
        );
    }
}

export default MarketRow;
