import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react";
import Immutable from "immutable";
import classNames from "classnames";
import market_utils from "common/market_utils";
import {FormattedDate} from "react-intl";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import SettingsActions from "actions/SettingsActions";
import classnames from "classnames";
import PriceText from "../Utility/PriceText";
import TransitionWrapper from "../Utility/TransitionWrapper";

class TableHeader extends React.Component {

    render() {
        let {buy, baseSymbol, quoteSymbol} = this.props;

        return (
            <thead>
                <tr>
                    <th style={{width: "18%", textAlign: "center"}}><Translate className="header-sub-title" content="exchange.price" /></th>
                    <th style={{width: "18%", textAlign: "center"}}>{baseSymbol ? <span className="header-sub-title">{quoteSymbol}</span> : null}</th>
                    <th style={{width: "18%", textAlign: "center"}}>{baseSymbol ? <span className="header-sub-title">{baseSymbol}</span> : null}</th>
                    <th style={{width: "28%", textAlign: "center"}}><Translate className="header-sub-title" content="transaction.expiration" /></th>
                    <th style={{width: "18%"}}></th>
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
            nextProps.base !== this.props.base
        );
    }

    render() {
        let {base, quote, order, cancel_text, showSymbols, invert} = this.props;
        let {value, price, amount} = market_utils.parseOrder(order, base, quote);
        let isAskOrder = market_utils.isAsk(order, base);
        let tdClass = classNames({orderHistoryBid: !isAskOrder, orderHistoryAsk: isAskOrder});

        let priceSymbol = showSymbols ? <span>{` ${base.get("symbol")}/${quote.get("symbol")}`}</span> : null;
        let valueSymbol = showSymbols ? " " + base.get("symbol") : null;
        let amountSymbol = showSymbols ? " " + quote.get("symbol") : null;

            return (
                <tr key={order.id}>
                    <td style={{width: "18%"}} className={tdClass}>
                        <PriceText preFormattedPrice={price} />
                        {priceSymbol}
                    </td>
                    <td style={{width: "18%"}}>{utils.format_number(amount, quote.get("precision") - 2)} {amountSymbol}</td>
                    <td style={{width: "18%"}}>{utils.format_number(value, base.get("precision") - 2)} {valueSymbol}</td>
                    <td style={{width: "28%"}}><FormattedDate
                        value={order.expiration}
                        format="short"
                        />
                    </td>
                    <td className="text-right" style={{width: "18%", padding: "2px 5px"}}>
                        <a style={{marginRight: "0"}} className="order-cancel" onClick={this.props.onCancel}>
                        <span>{cancel_text}</span>
                        </a>
                    </td>
                </tr>
            );
        // }
    }
}

OrderRow.defaultProps = {
    showSymbols: false,
    invert: false
};


class MyOpenOrders extends React.Component {


    shouldComponentUpdate(nextProps, nextState) {
        return (
                nextProps.currentAccount !== this.props.currentAccount ||
                nextProps.className !== this.props.className ||
                !Immutable.is(nextProps.orders, this.props.orders)
            );
    }

    componentDidMount() {
        let asksContainer = ReactDOM.findDOMNode(this.refs.asks);
        Ps.initialize(asksContainer);
    }

    componentDidUpdate(prevProps) {
        let asksContainer = ReactDOM.findDOMNode(this.refs.asks);
        Ps.update(asksContainer);     
    }

    render() {
        let {orders, currentAccount, base, quote, quoteSymbol, baseSymbol} = this.props;
        let bids = null, asks = null;

        let emptyRow = <tr><td style={{textAlign: "center"}} colSpan="5"><Translate content="account.no_orders" /></td></tr>;

        if(orders.size > 0 && base && quote) {
            let cancel = counterpart.translate("account.perm.cancel");

            bids = orders.filter(a => {
                return (a.seller === currentAccount && a.sell_price.quote.asset_id !== base.get("id"));
            }).sort((a, b) => {
                let {price: a_price} = market_utils.parseOrder(a, base, quote);
                let {price: b_price} = market_utils.parseOrder(b, base, quote);

                return b_price.full - a_price.full;
            }).map((order, index) => {
                let {price} = market_utils.parseOrder(order, base, quote);
                return <OrderRow price={price.full} ref="orderRow" key={order.id} order={order} base={base} quote={quote} cancel_text={cancel} onCancel={this.props.onCancel.bind(this, order.id)}/>;
            }).toArray();

            asks = orders.filter(a => {
                return (a.seller === currentAccount && a.sell_price.quote.asset_id === base.get("id"));
            }).sort((a, b) => {
                let {price: a_price} = market_utils.parseOrder(a, base, quote);
                let {price: b_price} = market_utils.parseOrder(b, base, quote);

                return a_price.full - b_price.full;
            }).map(order => {
                let {price} = market_utils.parseOrder(order, base, quote);
                return <OrderRow price={price.full} key={order.id} order={order} base={base} quote={quote} cancel_text={cancel} onCancel={this.props.onCancel.bind(this, order.id)}/>;
            }).toArray();

        } else {
            return (
                <div key="open_orders" className="grid-content text-center ps-container" ref="orders">
                    <table className="table order-table my-orders text-right table-hover">
                        <tbody>
                            {emptyRow}
                        </tbody>
                    </table>

                    <table className="table order-table my-orders text-right table-hover">
                        <tbody>
                            {emptyRow}
                        </tbody>
                </table>
                </div>
            );
        }

        let rows = [];

        if (asks.length) {
            rows = rows.concat(asks);
        }

        if (bids.length) {
            rows = rows.concat(bids);
        }

        rows.sort((a, b) => {
            return a.props.price - b.props.price;
        })

        // if (bids.length === 0 && asks.length ===0) {
        //     return <div key="open_orders" className="grid-content no-padding text-center ps-container" ref="orders"></div>;
        // }

        return (
            <div
                style={{marginBottom: "15px"}}
                key="open_orders"
                className={this.props.className}
                ref="orders">

                <div className="exchange-bordered small-12" style={{height: 266}}>
                    <div className="exchange-content-header">
                        <Translate content="exchange.my_orders" />
                    </div>
                    <table className="table order-table text-right table-hover">
                        <TableHeader type="sell" baseSymbol={baseSymbol} quoteSymbol={quoteSymbol}/>
                    </table>

                    <div className="grid-block no-padding market-right-padding" ref="asks" style={{overflow: "hidden", maxHeight: 200}}>
                        <table style={{paddingBottom: 5}}  className="table order-table text-right table-hover">
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

exports.OrderRow = OrderRow;
exports.TableHeader = TableHeader;
exports.MyOpenOrders = MyOpenOrders;
