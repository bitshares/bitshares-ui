import React from "react";
import Icon from "../Icon/Icon";
import Immutable from "immutable";
import classNames from "classnames";
import market_utils from "common/market_utils";

class MyOpenOrders extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.account.id !== this.props.account.id ||
            !Immutable.is(nextProps.orders, this.props.orders)
            );
    }

    render() {
        let {orders, account, base, quote} = this.props;
        console.log("orders:", orders.toJS());
        let orderRows = null;

        if(orders.size > 0) {
            orderRows = orders.filter(a => {
                return a.seller === account; 
            }).sort((a, b) => {
                let a_id = parseInt(a.id.split(".")[2], 10);
                let b_id = parseInt(b.id.split(".")[2], 10);
                return b_id > a_id;
            }).map(order => {
                let isAskOrder = market_utils.isAsk(order, base);
                let {buy, sell} = market_utils.parseOrder(order, isAskOrder);
                let price = (sell.amount / base.precision) / (buy.amount / quote.precision);

                let tdClass = classNames({orderHistoryBid: !isAskOrder, orderHistoryAsk: isAskOrder});

                return (
                     <tr key={order.id}>
                        <td>
                            <a onClick={this.props.onCancel.bind(this, order.id)}>
                                <Icon name="cross-circle" fillClass="fill-black" />
                            </a>
                        </td>
                        <td className={tdClass}>{buy.amount / quote.precision}</td>
                        <td>{price}</td>
                        {/*TODO: add expiration data <td>{order.expiration}</td> */}
                    </tr>
                    );
            }).toArray();
        }
        return (
            <table className="table">
                <thead>
                <tr>
                    <th>{/* "Cancel button" column */}</th>
                    <th>Quantity ({quote.symbol})</th>
                    <th>Price ({base.symbol})</th>
                    <th>{/* "Buy/Sell" column */}</th>
                </tr>
                </thead>
                <tbody>
                    {orderRows}
                </tbody>
            </table>
        );
    }
}

export default MyOpenOrders;
