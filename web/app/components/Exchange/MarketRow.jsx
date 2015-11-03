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

        let price = utils.convertPrice(quote, base);

        let rowStyles = {};
        if (this.props.leftAlign) {
            rowStyles.textAlign = "left";
        }

        let buttonClass = "button outline";
        let buttonStyle = null;
        if (this.props.compact) {
            buttonClass += " no-margin";
            buttonStyle = {marginBottom: 0, fontSize: "0.75rem" , padding: "4px 10px" , borderRadius: "0px" , letterSpacing: "0.05rem"}
        }

        let columns = this.props.columns.map(column => {
            switch (column.name) {
                case "marketName":
                    return (
                        <td key={column.index} onClick={this._onClick.bind(this, marketID)}>
                            <div className={buttonClass} style={buttonStyle}>{marketName}</div>
                        </td>
                    );

                case "price":
                    return (
                        <td key={column.index}>
                            <FormattedPrice
                                style={{fontWeight: "bold"}}
                                quote_amount={price.quoteAmount}
                                quote_asset={quote.get("id")}
                                base_amount={price.baseAmount}
                                base_asset={base.get("id")}
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

                case "baseSupply":
                    return (
                        <td key={column.index}>
                            {base_dynamic_data ? <FormattedAsset
                            style={{fontWeight: "bold"}}
                            amount={parseInt(base_dynamic_data.get("current_supply"), 10)}
                            asset={base.get("id")}/> : null}
                        </td>
                    );

                case "remove":
                    return (
                        <td key={column.index} className="clickable" onClick={this.props.removeMarket}>
                            <span style={{marginBottom: "6px", marginRight: "6px", zIndex: 999}} className="text float-right remove">–</span>
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
