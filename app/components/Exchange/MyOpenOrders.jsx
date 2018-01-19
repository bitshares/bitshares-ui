import React from "react";
import {PropTypes} from "react";
import { Link } from "react-router";
import {FormattedDate} from "react-intl";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import PriceText from "../Utility/PriceText";
import TransitionWrapper from "../Utility/TransitionWrapper";
import AssetName from "../Utility/AssetName";
import Icon from "../Icon/Icon";
import { ChainStore } from "bitsharesjs/es";
import { LimitOrder, CallOrder } from "common/MarketClasses";
import { EquivalentValueComponent } from "../Utility/EquivalentValueComponent";
import {MarketPrice} from "../Utility/MarketPrice";
import FormattedPrice from "../Utility/FormattedPrice";
const leftAlign = {textAlign: "left"};

class TableHeader extends React.Component {

    render() {
        let {baseSymbol, quoteSymbol, dashboard, isMyAccount, settings} = this.props;
        let preferredUnit = settings ? settings.get("unit") : "1.3.0";

        return !dashboard ? (
            <thead>
                <tr>
                    <th style={{paddingLeft: 10, textAlign: this.props.leftAlign ? "left" : ""}}><Translate className="header-sub-title" content="exchange.price" /></th>
                    <th style={this.props.leftAlign ? {textAlign: "left"} : null}>{baseSymbol ? <span className="header-sub-title"><AssetName dataPlace="top" name={quoteSymbol} /></span> : null}</th>
                    <th style={this.props.leftAlign ? {textAlign: "left"} : null}>{baseSymbol ? <span className="header-sub-title"><AssetName dataPlace="top" name={baseSymbol} /></span> : null}</th>
                    <th style={{width: "28%", textAlign: this.props.leftAlign ? "left" : ""}}><Translate className="header-sub-title" content="transaction.expiration" /></th>
                    <th />
                </tr>
            </thead>
        ) : (
            <thead>
                <tr>
                    <th style={leftAlign} colSpan="5"><Translate content="exchange.description" /></th>
                    <th style={leftAlign}><Translate content="exchange.price" /></th>
                    <th style={leftAlign}><Translate content="exchange.price_market" /></th>
                    <th style={{textAlign: "right"}}><Translate content="exchange.value" /></th>
                    {/* <th><Translate content="transaction.expiration" /></th> */}
                    <th><Translate content="account.trade" /></th>
                    {isMyAccount ? <th id="cancelAllOrders" style={{cursor: "pointer"}}><Translate content="wallet.cancel" /></th> : null}
                </tr>
            </thead>
        );
    }
}

TableHeader.defaultProps = {
    quoteSymbol: null,
    baseSymbol: null
};

class OrderRow extends React.Component {

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
        let {base, quote, order, showSymbols, dashboard, isMyAccount, settings} = this.props;
        const isBid = order.isBid();
        const isCall = order.isCall();
        let tdClass = isCall ? "orderHistoryCall" : isBid ? "orderHistoryBid" : "orderHistoryAsk";

        let priceSymbol = showSymbols ? <span>{` ${base.get("symbol")}/${quote.get("symbol")}`}</span> : null;
        let valueSymbol = showSymbols ? " " + base.get("symbol") : null;
        let amountSymbol = showSymbols ? " " + quote.get("symbol") : null;
        let preferredUnit = settings ? settings.get("unit") : "1.3.0";
        let quoteColor = !isBid ? "value negative" : "value positive";
        let baseColor = isBid ? "value negative" : "value positive";

        return !dashboard ? (
            <tr key={order.id}>
                <td className={tdClass} style={{paddingLeft: 10}}>
                    <PriceText price={order.getPrice()} base={base} quote={quote} />
                    {priceSymbol}
                </td>
                <td>{utils.format_number(order[!isBid ? "amountForSale" : "amountToReceive"]().getAmount({real: true}), quote.get("precision"))} {amountSymbol}</td>
                <td>{utils.format_number(order[!isBid ? "amountToReceive" : "amountForSale"]().getAmount({real: true}), base.get("precision"))} {valueSymbol}</td>
                <td style={{width: "28%"}}>
                    {isCall ? null : <FormattedDate
                        value={order.expiration}
                        format="short"
                    />}
                </td>
                <td className="text-center" style={{ padding: "2px 5px"}}>
                    {isCall ? null : <a style={{marginRight: 0}} className="order-cancel" onClick={this.props.onCancel}>
                        <Icon name="cross-circle" className="icon-14px" />
                    </a>}
                </td>
            </tr>
        ) : (
            <tr key={order.id} className="clickable">
                <td colSpan="5" style={leftAlign} onClick={this.props.onFlip}>
                    {isBid ?
                        <Translate
                            content="exchange.buy_description"
                            baseAsset={utils.format_number(order[isBid ? "amountToReceive" : "amountForSale"]().getAmount({real: true}), base.get("precision"), false)}
                            quoteAsset={utils.format_number(order[isBid ? "amountForSale" : "amountToReceive"]().getAmount({real: true}), quote.get("precision"), false)}
                            baseName={<AssetName noTip customClass={quoteColor} name={quote.get("symbol")} />}
                            quoteName={<AssetName noTip customClass={baseColor} name={base.get("symbol")} />}
                            /> :
                        <Translate
                            content="exchange.sell_description"
                            baseAsset={utils.format_number(order[isBid ? "amountToReceive" : "amountForSale"]().getAmount({real: true}), base.get("precision"), false)}
                            quoteAsset={utils.format_number(order[isBid ? "amountForSale" : "amountToReceive"]().getAmount({real: true}), quote.get("precision"), false)}
                            baseName={<AssetName noTip customClass={quoteColor} name={quote.get("symbol")} />}
                            quoteName={<AssetName noTip customClass={baseColor} name={base.get("symbol")} />}
                        />}
                </td>
                <td style={leftAlign} onClick={this.props.onFlip}>
                    <FormattedPrice
                        base_amount={order.sellPrice().base.amount} base_asset={order.sellPrice().base.asset_id}
                        quote_amount={order.sellPrice().quote.amount} quote_asset={order.sellPrice().quote.asset_id}
                        force_direction={base.get("symbol")}
                        hide_symbols
                    />
                </td>
                <td style={leftAlign} onClick={this.props.onFlip}>
                    {isBid ?
                        <MarketPrice
                            base={base.get("id")}
                            quote={quote.get("id")}
                            force_direction={base.get("symbol")}
                            hide_symbols
                            hide_asset
                        />
                        :
                        <MarketPrice
                            base={base.get("id")}
                            quote={quote.get("id")}
                            force_direction={base.get("symbol")}
                            hide_symbols
                            hide_asset
                        />
                    }
                </td>
                <td style={{textAlign: "right"}} onClick={this.props.onFlip}>
                    <EquivalentValueComponent hide_asset amount={order.amountForSale().getAmount()} fromAsset={order.amountForSale().asset_id} noDecimals={true} toAsset={preferredUnit}/> <AssetName name={preferredUnit} />
                </td>
                {/* <td>
                    {isCall ? null : <FormattedDate
                        value={order.expiration}
                        format="short"
                    />}
                    </td> */}
                <td><Link to={`/market/${quote.get("symbol")}_${base.get("symbol")}`}><Icon name="trade" className="icon-14px" /></Link></td>
                {isMyAccount ? <td className="text-center" style={{ padding: "2px 5px"}}>
                    {isCall ? null : <span style={{marginRight: 0}} className="order-cancel">
                        <input type="checkbox" className="orderCancel" onChange={this.props.onCheckCancel} />
                    </span>}
                </td> : null}
            </tr>
        );
    }
}

OrderRow.defaultProps = {
    showSymbols: false
};


class MyOpenOrders extends React.Component {

    constructor() {
        super();

        this._getOrders = this._getOrders.bind(this);
    }

    componentDidMount() {
        let asksContainer = this.refs.asks;
        if (asksContainer) Ps.initialize(asksContainer);
    }

    componentDidUpdate() {
        let asksContainer = this.refs.asks;
        if (asksContainer) Ps.update(asksContainer);
    }

    _getOrders() {
        const { currentAccount, base, quote, feedPrice } = this.props;
        const orders = currentAccount.get("orders"), call_orders = currentAccount.get("call_orders");
        const baseID = base.get("id"), quoteID = quote.get("id");
        const assets = {
            [base.get("id")]: {precision: base.get("precision")},
            [quote.get("id")]: {precision: quote.get("precision")}
        };
        let limitOrders = orders.toArray().map(order => {
            let o = ChainStore.getObject(order);
            if (!o) return null;
            let sellBase = o.getIn(["sell_price", "base", "asset_id"]), sellQuote = o.getIn(["sell_price", "quote", "asset_id"]);
            if (sellBase === baseID && sellQuote === quoteID ||
                sellBase === quoteID && sellQuote === baseID
            ) {
                return new LimitOrder(o.toJS(), assets, quote.get("id"));
            }
        }).filter(a => !!a);

        let callOrders = call_orders.toArray().map(order => {
            try {
                let o = ChainStore.getObject(order);
                if (!o) return null;
                let sellBase = o.getIn(["call_price", "base", "asset_id"]), sellQuote = o.getIn(["call_price", "quote", "asset_id"]);
                if (sellBase === baseID && sellQuote === quoteID ||
                    sellBase === quoteID && sellQuote === baseID
                ) {
                    return feedPrice ? new CallOrder(o.toJS(), assets, quote.get("id"), feedPrice) : null;
                }
            } catch(e) {
                return null;
            }
        }).filter(a => !!a).filter(a => {
            try {
                return a.isMarginCalled();
            } catch(err) {
                return false;
            }
        });
        return limitOrders.concat(callOrders);
    }

    render() {
        let {base, quote, quoteSymbol, baseSymbol} = this.props;
        if (!base || !quote) return null;

        const orders = this._getOrders();
        let emptyRow = <tr><td style={{textAlign: "center"}} colSpan="5"><Translate content="account.no_orders" /></td></tr>;

        let bids = orders.filter(a => {
            return a.isBid();
        }).sort((a, b) => {
            return b.getPrice() - a.getPrice();
        }).map(order => {
            let price = order.getPrice();
            return <OrderRow price={price} key={order.id} order={order} base={base} quote={quote} onCancel={this.props.onCancel.bind(this, order.id)}/>;
        });

        let asks = orders.filter(a => {
            return !a.isBid();
        }).sort((a, b) => {
            return a.getPrice() - b.getPrice();
        }).map(order => {
            let price = order.getPrice();
            return <OrderRow price={price} key={order.id} order={order} base={base} quote={quote} onCancel={this.props.onCancel.bind(this, order.id)}/>;
        });

        let rows = [];

        if (asks.length) {
            rows = rows.concat(asks);
        }

        if (bids.length) {
            rows = rows.concat(bids);
        }

        rows.sort((a, b) => {
            return a.props.price - b.props.price;
        });

        return (
            <div
                style={{marginBottom: "15px"}}
                key="open_orders"
                className={this.props.className}
            >

                <div className="exchange-bordered small-12" style={{height: 266}}>
                    <div className="exchange-content-header">
                        <Translate content="exchange.my_orders" />
                    </div>
                    <table className="table order-table table-hover">
                        <TableHeader leftAlign type="sell" baseSymbol={baseSymbol} quoteSymbol={quoteSymbol}/>
                    </table>

                    <div className="grid-block no-padding market-right-padding" ref="asks" style={{overflow: "hidden", maxHeight: 200}}>
                        <table style={{paddingBottom: 5}}  className="table order-table table-hover">
                            <TransitionWrapper
                                component="tbody"
                                transitionName="newrow"
                            >
                                {rows.length ? rows : emptyRow}
                            </TransitionWrapper>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

MyOpenOrders.defaultProps = {
    base: {},
    quote: {},
    orders: {},
    quoteSymbol: "",
    baseSymbol: ""
};

MyOpenOrders.propTypes = {
    base: PropTypes.object.isRequired,
    quote: PropTypes.object.isRequired,
    orders: PropTypes.object.isRequired,
    quoteSymbol: PropTypes.string.isRequired,
    baseSymbol: PropTypes.string.isRequired
};

export { OrderRow, TableHeader, MyOpenOrders };
