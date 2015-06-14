import React from "react";
import Icon from "../Icon/Icon";
import Immutable from "immutable";

class MyOpenOrders extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.account.id !== this.props.account.id ||
            !Immutable.is(nextProps.orders, this.props.orders)
            );
    }

    render() {
        let {orders, account} = this.props;
        console.log("orders:", orders.toJS());
        let orderRows = null;

        if(orders.size > 0) {
            orderRows = orders.filter(a => {
                // console.log(account, a);
                return a.seller === account; 
            }).map(order => {
                let isAskOrder = order.sell_price.base.asset_id === this.props.base.id;
                let buy = isAskOrder ? order.sell_price.quote : order.sell_price.base;
                let sell = isAskOrder ? order.sell_price.base : order.sell_price.quote;
                let buyPrecision = isAskOrder ? this.props.base.precision : this.props.quote.precision;
                let sellPrecision = isAskOrder ? this.props.quote.precision : this.props.base.precision;

                return (
                     <tr key={order.id}>
                        <td>
                            <a onClick={this.props.onCancel.bind(this, order.id)}>
                                <Icon name="cross-circle" fillClass="fill-black" />
                            </a>
                        </td>
                        <td>{buy.amount / this.props.quote.precision}</td>
                        <td>{(sell.amount / this.props.base.precision) / (buy.amount / this.props.quote.precision)}</td>
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
                    <th>Quantity ({this.props.quote.symbol})</th>
                    <th>Price ({this.props.base.symbol})</th>
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
