import React from "react";
import {PropTypes} from "react";
//import {FormattedDate} from "react-intl";
import FormattedAsset from "../Utility/FormattedAsset";
//import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
//import AssetName from "../Utility/AssetName";
import TimeAgo from "../Utility/TimeAgo";

class TableHeader extends React.Component {

    render() {

        return (
            <thead>
                <tr>
                    <th style={{textAlign: "right"}}><Translate content="exchange.price" /></th>
                    <th style={{textAlign: "right"}}><Translate content="transfer.amount" /></th>
                    <th style={{textAlign: "right"}}><Translate content="transaction.settlement_date" /><span style={{visibility: "hidden"}} className="header-sub-title">d</span></th>
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
        let {quote, order, showSymbols} = this.props;

        let amountSymbol = showSymbols ? " " + quote.get("symbol") : null;

        return (
            <tr>
                <td>{utils.format_number(order.getPrice(), quote.get("precision"))} {amountSymbol}</td>
                <td><FormattedAsset amount={order[!order.isBid() ? "amountForSale" : "amountToReceive"]().getAmount()} asset={order[!order.isBid() ? "amountForSale" : "amountToReceive"]().asset_id} /></td>
                <td><TimeAgo time={order.settlement_date} /><span style={{visibility: "hidden"}} className="">_</span></td>
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

    // componentDidMount() {
    //     let orderContainer = this.refs.orders;
    //     Ps.initialize(orderContainer);
    // }

    render() {
        let {orders, base, quote, quoteSymbol, baseSymbol} = this.props;

        let activeOrders = null;

        if(orders.size > 0 && base && quote) {
            let index = 0;

            activeOrders = orders
            .sort((a, b) => {
                return a.isBefore(b) ? -1 : 1;
            }).map(order => {
                return <SettleOrderRow key={index++} order={order} base={base} quote={quote}/>;
            }).toArray();

        } else {
            return null;
        }

		return (
            <div key="open_orders" className="grid-block no-padding market-right-padding" ref="orders" style={{overflow: "hidden", maxHeight: 400}}>
                    <table className="table order-table text-right table-hover">
                        <TableHeader type="buy" baseSymbol={baseSymbol} quoteSymbol={quoteSymbol}/>
                        <tbody ref="orders">
                            {activeOrders}
                        </tbody>
                    </table>
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
