import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react";
import Immutable from "immutable";
import classNames from "classnames";
import market_utils from "common/market_utils";
import {FormattedDate} from "react-intl";
import FormattedAsset from "../Utility/FormattedAsset";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import SettingsActions from "actions/SettingsActions";
import classnames from "classnames";
import PriceText from "../Utility/PriceText";

class TableHeader extends React.Component {

    render() {
        let {buy, baseSymbol, quoteSymbol} = this.props;

        return (
            <thead>
                <tr>
                    <th style={{textAlign: "right"}}><Translate content="exchange.price" /><br/>{baseSymbol ? <span className="header-sub-title">({baseSymbol}/{quoteSymbol})</span> : null}</th>
                    <th style={{textAlign: "right"}}><Translate content="transfer.amount" /><br/>{baseSymbol ? <span className="header-sub-title">({quoteSymbol})</span> : null}</th>
                    <th style={{textAlign: "right"}}><Translate content="transaction.settlement_date" /><br/><span style={{visibility: "hidden"}} className="header-sub-title">d</span></th>
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

    // shouldComponentUpdate(nextProps) {
    //     return (
    //         nextProps.order.for_sale !== this.props.order.for_sale ||
    //         nextProps.order.id !== this.props.order.id
    //     );
    // }

    render() {
        let {base, quote, order, showSymbols, invert, settlementPrice} = this.props;

        let priceSymbol = showSymbols ? <span>{` ${base.get("symbol")}/${quote.get("symbol")}`}</span> : null;
        let valueSymbol = showSymbols ? " " + base.get("symbol") : null;
        let amountSymbol = showSymbols ? " " + quote.get("symbol") : null;

            return (
                <tr>
                    <td>{utils.format_number(settlementPrice, quote.get("precision"))} {amountSymbol}</td>
                    <td><FormattedAsset amount={order.balance.amount} asset={order.balance.asset_id} /></td>
                    <td><FormattedDate
                        value={order.settlement_date}
                        format="short"
                        />
                    </td>
                </tr>
            );
        // }
    }
}

SettleOrderRow.defaultProps = {
    showSymbols: false,
    invert: false
};


class OpenSettleOrders extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        return (
                nextProps.currentAccount !== this.props.currentAccount ||
                !Immutable.is(nextProps.orders, this.props.orders)            );
    }

    componentDidMount() {
        let orderContainer = ReactDOM.findDOMNode(this.refs.orders);
        Ps.initialize(orderContainer);
    }

    render() {
        let {orders, currentAccount, base, quote, quoteSymbol, baseSymbol, settlementPrice} = this.props;
        let activeOrders = null;

        if(orders.size > 0 && base && quote) {

            activeOrders = orders
            .sort((a, b) => {
                return a.settlement_date > b.settlement_date;
            }).map((order, key) => {
                return <SettleOrderRow settlementPrice={settlementPrice} order={order} base={base} quote={quote}/>;
            }).toArray();

        } else {
            return (
                <div key="open_orders" className="grid-content text-center ps-container" ref="orders">
                    <table className="table order-table my-orders text-right table-hover">
                        <tbody>
                        </tbody>
                    </table>

                    <table className="table order-table my-orders text-right table-hover">
                        <tbody>
                        </tbody>
                </table>
                </div>
            );
        }

        return (
            <div style={{maxHeight: "400px", borderBottom: "1px solid grey"}} key="open_orders" className="grid-block small-12 no-padding small-vertical medium-horizontal align-spaced ps-container middle-content" ref="orders">
                <div className="small-12 medium-6">
                    <div className="exchange-content-header"><Translate content="exchange.settle_orders" /></div>
                    <table className="table order-table text-right table-hover">
                        <TableHeader type="buy" baseSymbol={baseSymbol} quoteSymbol={quoteSymbol}/>
                        <tbody>
                            {activeOrders}
                        </tbody>
                    </table>
                </div>
            </div>
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
