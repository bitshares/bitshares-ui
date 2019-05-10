import React from "react";
import Translate from "react-translate-component";

const leftAlign = {textAlign: "left"};
import utils from "common/utils";
import {Link} from "react-router-dom";
import {MarketPrice} from "../Utility/MarketPrice";
import FormattedPrice from "../Utility/FormattedPrice";
import AssetName from "../Utility/AssetName";
import {EquivalentValueComponent} from "../Utility/EquivalentValueComponent";
import Icon from "../Icon/Icon";

class AccountOrderRow extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.order.for_sale !== this.props.order.for_sale ||
            nextProps.order.id !== this.props.order.id ||
            nextProps.quote !== this.props.quote ||
            nextProps.base !== this.props.base ||
            nextProps.order.market_base !== this.props.order.market_base
        );
    }

    render() {
        let {
            base,
            quote,
            order,
            showSymbols,
            dashboard,
            isMyAccount,
            settings
        } = this.props;
        const isBid = order.isBid();
        const isCall = order.isCall();

        let preferredUnit = settings ? settings.get("unit") : "1.3.0";
        let quoteColor = !isBid ? "value negative" : "value positive";
        let baseColor = isBid ? "value negative" : "value positive";

        return (
            <tr key={order.id} className="clickable">
                {isMyAccount ? (
                    <td className="text-center">
                        {isCall ? null : (
                            <span
                                style={{marginRight: 0}}
                                className="order-cancel"
                            >
                                <input
                                    type="checkbox"
                                    className="orderCancel"
                                    onChange={this.props.onCheckCancel}
                                />
                            </span>
                        )}
                    </td>
                ) : null}
                <td>
                    <Link
                        to={`/market/${quote.get("symbol")}_${base.get(
                            "symbol"
                        )}`}
                    >
                        <Icon
                            name="trade"
                            title="icons.trade.trade"
                            className="icon-14px"
                        />
                    </Link>
                </td>
                <td style={leftAlign}>#{order.id.substring(4)}</td>
                <td colSpan="4" style={leftAlign} onClick={this.props.onFlip}>
                    {isBid ? (
                        <Translate
                            content="exchange.buy_description"
                            baseAsset={utils.format_number(
                                order[
                                    isBid ? "amountToReceive" : "amountForSale"
                                ]().getAmount({real: true}),
                                base.get("precision"),
                                false
                            )}
                            quoteAsset={utils.format_number(
                                order[
                                    isBid ? "amountForSale" : "amountToReceive"
                                ]().getAmount({real: true}),
                                quote.get("precision"),
                                false
                            )}
                            baseName={
                                <AssetName
                                    noTip
                                    customClass={quoteColor}
                                    name={quote.get("symbol")}
                                />
                            }
                            quoteName={
                                <AssetName
                                    noTip
                                    customClass={baseColor}
                                    name={base.get("symbol")}
                                />
                            }
                        />
                    ) : (
                        <Translate
                            content="exchange.sell_description"
                            baseAsset={utils.format_number(
                                order[
                                    isBid ? "amountToReceive" : "amountForSale"
                                ]().getAmount({real: true}),
                                base.get("precision"),
                                false
                            )}
                            quoteAsset={utils.format_number(
                                order[
                                    isBid ? "amountForSale" : "amountToReceive"
                                ]().getAmount({real: true}),
                                quote.get("precision"),
                                false
                            )}
                            baseName={
                                <AssetName
                                    noTip
                                    customClass={quoteColor}
                                    name={quote.get("symbol")}
                                />
                            }
                            quoteName={
                                <AssetName
                                    noTip
                                    customClass={baseColor}
                                    name={base.get("symbol")}
                                />
                            }
                        />
                    )}
                </td>
                <td style={leftAlign} onClick={this.props.onFlip}>
                    <FormattedPrice
                        base_amount={order.sellPrice().base.amount}
                        base_asset={order.sellPrice().base.asset_id}
                        quote_amount={order.sellPrice().quote.amount}
                        quote_asset={order.sellPrice().quote.asset_id}
                        force_direction={base.get("symbol")}
                        hide_symbols
                    />
                </td>
                <td style={leftAlign} onClick={this.props.onFlip}>
                    {isBid ? (
                        <MarketPrice
                            base={base.get("id")}
                            quote={quote.get("id")}
                            force_direction={base.get("symbol")}
                            hide_symbols
                            hide_asset
                        />
                    ) : (
                        <MarketPrice
                            base={base.get("id")}
                            quote={quote.get("id")}
                            force_direction={base.get("symbol")}
                            hide_symbols
                            hide_asset
                        />
                    )}
                </td>
                <td style={{textAlign: "right"}} onClick={this.props.onFlip}>
                    <EquivalentValueComponent
                        hide_asset
                        amount={order.amountForSale().getAmount()}
                        fromAsset={order.amountForSale().asset_id}
                        noDecimals={true}
                        toAsset={preferredUnit}
                    />{" "}
                    <AssetName name={preferredUnit} />
                </td>
            </tr>
        );
    }
}

AccountOrderRow.defaultProps = {
    showSymbols: false
};

export default AccountOrderRow;
