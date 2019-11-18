import React from "react";
import counterpart from "counterpart";
import utils from "common/utils";
import Translate from "react-translate-component";
import PriceText from "../../Utility/PriceText";
import AssetName from "../../Utility/AssetName";
const rightAlign = {textAlign: "right"};
import {Tooltip, Checkbox} from "bitshares-ui-style-guide";

function MarketOrdersViewTableHeader({
    baseSymbol,
    quoteSymbol,
    selected,
    onCancelToggle
}) {
    return (
        <thead>
            <tr>
                <th style={{width: "6%", textAlign: "center"}}>
                    {onCancelToggle ? (
                        <Tooltip
                            title={counterpart.translate(
                                "exchange.cancel_order_select_all"
                            )}
                            placement="left"
                        >
                            <Checkbox
                                className="order-cancel-toggle"
                                checked={selected}
                                onChange={onCancelToggle}
                            />
                        </Tooltip>
                    ) : null}
                </th>
                <th style={rightAlign}>
                    <Translate
                        className="header-sub-title"
                        content="exchange.price"
                    />
                </th>
                <th style={rightAlign}>
                    {baseSymbol ? (
                        <span className="header-sub-title">
                            <AssetName dataPlace="top" name={quoteSymbol} />
                        </span>
                    ) : null}
                </th>
                <th style={rightAlign}>
                    {baseSymbol ? (
                        <span className="header-sub-title">
                            <AssetName dataPlace="top" name={baseSymbol} />
                        </span>
                    ) : null}
                </th>
                <th style={rightAlign}>
                    <Translate
                        className="header-sub-title"
                        content="transaction.expiration"
                    />
                </th>
            </tr>
        </thead>
    );
}

MarketOrdersViewTableHeader.defaultProps = {
    quoteSymbol: null,
    baseSymbol: null
};

function MarketOrdersRowView({order, selected, base, quote, onCheckCancel}) {
    const isBid = order.isBid();
    const isCall = order.isCall();
    const tdClass = isCall
        ? "orderHistoryCall"
        : isBid
            ? "orderHistoryBid"
            : "orderHistoryAsk";

    return (
        <tr key={order.id}>
            <td className="text-center" style={{width: "6%"}}>
                {isCall ? null : (
                    <Checkbox
                        className="orderCancel"
                        checked={selected}
                        onChange={onCheckCancel}
                    />
                )}
            </td>
            <td className={tdClass} style={{paddingLeft: 10}}>
                <PriceText price={order.getPrice()} base={base} quote={quote} />
            </td>
            <td>
                {utils.format_number(
                    order[
                        !isBid ? "amountForSale" : "amountToReceive"
                    ]().getAmount({real: true}),
                    quote.get("precision")
                )}{" "}
            </td>
            <td>
                {utils.format_number(
                    order[
                        !isBid ? "amountToReceive" : "amountForSale"
                    ]().getAmount({real: true}),
                    base.get("precision")
                )}{" "}
            </td>
            <td>
                <Tooltip title={order.expiration.toLocaleString()}>
                    <div
                        style={{
                            textAlign: "right",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {isCall
                            ? null
                            : counterpart.localize(new Date(order.expiration), {
                                  type: "date",
                                  format: "short_custom"
                              })}
                    </div>
                </Tooltip>
            </td>
        </tr>
    );
}

class MarketsOrderView extends React.Component {
    render() {
        let {
            // Styles and Classes
            style,
            className,
            innerClass,
            innerStyle,
            headerStyle,

            // Bools
            noHeader,
            isSelected,
            tinyScreen,

            // Strings
            activeTab,
            baseSymbol,
            quoteSymbol,

            // Containers
            contentContainer,
            footerContainer,

            // Functions
            onCancelToggle
        } = this.props;

        return (
            <div style={style} key="open_orders" className={className}>
                <div className={innerClass} style={innerStyle}>
                    {noHeader ? null : (
                        <div
                            style={headerStyle}
                            className="exchange-content-header"
                        >
                            {activeTab == "my_orders" ? (
                                <Translate content="exchange.my_orders" />
                            ) : null}
                            {activeTab == "open_settlement" ? (
                                <Translate content="exchange.settle_orders" />
                            ) : null}
                        </div>
                    )}
                    <div className="grid-block shrink left-orderbook-header market-right-padding-only">
                        <table className="table order-table text-right fixed-table market-right-padding">
                            <MarketOrdersViewTableHeader
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                                selected={isSelected}
                                onCancelToggle={
                                    activeTab == "my_orders"
                                        ? onCancelToggle
                                        : null
                                }
                            />
                        </table>
                    </div>

                    <div
                        className="table-container grid-block market-right-padding-only no-overflow"
                        ref="container"
                        style={{
                            overflow: "hidden",
                            minHeight: tinyScreen ? 260 : 0,
                            maxHeight: 260,
                            lineHeight: "13px"
                        }}
                    >
                        <table className="table order-table table-highlight-hover table-hover no-stripes text-right fixed-table market-right-padding">
                            {contentContainer}
                        </table>
                    </div>
                    {footerContainer}
                </div>
            </div>
        );
    }
}

export {MarketsOrderView, MarketOrdersRowView};
