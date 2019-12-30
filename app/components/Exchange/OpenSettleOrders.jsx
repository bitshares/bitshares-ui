import React from "react";
import PropTypes from "prop-types";
import utils from "common/utils";
import Translate from "react-translate-component";
import AssetName from "../Utility/AssetName";
import counterpart from "counterpart";
import getLocale from "browser-locale";
import TransitionWrapper from "../Utility/TransitionWrapper";
import {Tooltip} from "bitshares-ui-style-guide";

class TableHeader extends React.Component {
    render() {
        let {baseSymbol, quoteSymbol} = this.props;

        return (
            <thead>
                <tr>
                    <th style={{textAlign: "right"}}>
                        <Translate content="exchange.price" />
                        <br />
                        {baseSymbol ? (
                            <span className="header-sub-title">
                                (<AssetName name={baseSymbol} />/
                                <AssetName name={quoteSymbol} />)
                            </span>
                        ) : null}
                    </th>
                    <th style={{textAlign: "right"}}>
                        <Translate content="transfer.amount" />
                        <br />
                        {quoteSymbol ? (
                            <span className="header-sub-title">
                                (<AssetName name={quoteSymbol} />)
                            </span>
                        ) : null}
                    </th>
                    <th style={{textAlign: "right"}}>
                        <Translate content="transaction.settlement_date" />
                        <br />
                        <span
                            style={{visibility: "hidden"}}
                            className="header-sub-title"
                        >
                            d
                        </span>
                    </th>
                </tr>
            </thead>
        );
    }
}

TableHeader.defaultProps = {
    quoteSymbol: null,
    baseSymbol: null
};

class SettleOrderRow extends React.Component {
    render() {
        let {base, quote, order, showSymbols} = this.props;

        let price =
            base.get("id") == "1.3.0"
                ? order.getPrice() / (1 + order.offset_percent / 10000)
                : order.getPrice() * (1 + order.offset_percent / 10000);
        let amountSymbol = showSymbols ? " " + quote.get("symbol") : null;

        return (
            <tr>
                <td className="text-center" style={{width: "6%"}}>
                    {" "}
                </td>
                <td>
                    {utils.format_number(price, quote.get("precision"))}{" "}
                    {amountSymbol}
                </td>
                <td>
                    {utils.format_number(
                        order[
                            !order.isBid() ? "amountForSale" : "amountToReceive"
                        ]().getAmount({real: true}),
                        quote.get("precision")
                    )}
                </td>
                <td>
                    {utils.format_number(
                        order[
                            !order.isBid() ? "amountToReceive" : "amountForSale"
                        ]().getAmount({real: true}),
                        base.get("precision")
                    )}
                </td>
                <td>
                    <Tooltip title={new Date(order.settlement_date).toString()}>
                        <div style={{textAlign: "right", whiteSpace: "nowrap"}}>
                            {counterpart.localize(
                                new Date(order.settlement_date),
                                {
                                    type: "date",
                                    format:
                                        getLocale()
                                            .toLowerCase()
                                            .indexOf("en-us") !== -1
                                            ? "market_history_us"
                                            : "market_history"
                                }
                            )}
                        </div>
                    </Tooltip>
                </td>
            </tr>
        );
    }
}

SettleOrderRow.defaultProps = {
    showSymbols: false,
    invert: false
};

class OpenSettleOrders extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.currentAccount !== this.props.currentAccount ||
            nextProps.orders !== this.props.orders
        );
    }

    render() {
        let {orders, base, quote} = this.props;

        let activeOrders = null;

        const emptyRow = (
            <tbody>
                <tr>
                    <td
                        style={{
                            textAlign: "center",
                            lineHeight: 4,
                            fontStyle: "italic"
                        }}
                        colSpan="5"
                    >
                        <Translate content="account.no_orders" />
                    </td>
                </tr>
            </tbody>
        );

        if (orders.size > 0 && base && quote) {
            activeOrders = orders
                .sort((a, b) => {
                    return a.isBefore(b) ? -1 : 1;
                })
                .map(order => {
                    return (
                        <SettleOrderRow
                            key={order.id}
                            order={order}
                            base={base}
                            quote={quote}
                        />
                    );
                })
                .toArray();
        }

        return (
            <TransitionWrapper
                ref="contentTransition"
                component="tbody"
                transitionName="newrow"
            >
                {activeOrders ? activeOrders : emptyRow}
            </TransitionWrapper>
        );
    }
}

OpenSettleOrders.defaultProps = {
    base: {},
    quote: {},
    orders: {},
    quoteSymbol: "",
    baseSymbol: ""
};

OpenSettleOrders.propTypes = {
    base: PropTypes.object.isRequired,
    quote: PropTypes.object.isRequired,
    orders: PropTypes.object.isRequired,
    quoteSymbol: PropTypes.string.isRequired,
    baseSymbol: PropTypes.string.isRequired
};

export default OpenSettleOrders;
