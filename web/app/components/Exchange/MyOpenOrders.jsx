import React from "react";
import BaseComponent from "../BaseComponent";
import Icon from "../Icon/Icon";

class MyOpenOrders extends BaseComponent {
    constructor(props) {
        super(props);
    }

    render() {
        function orderEntry(order) {
            return (
                <tr>
                    {/*TODO: use icon cross-circle instead of plus-circle. Wire this to an order cancel operation */}
                    <td><a><Icon name="plus-circle" inverse="1" fillClass="fill-black" /></a></td>
                    <td>{order.for_sale}</td>
                    <td>{order.sell_price.quote.amount / order.sell_price.base.amount }</td>
                    {/*TODO: add expiration data <td>{order.expiration}</td> */}
                </tr>
            );
        }

        if(this.props.orders.count() == 0) {
            return (
                <p>No open orders.</p>
            );
        }
        else {
            return (
                <table className="table">
                    <thead>
                    <tr>
                        <th>{/* "Cancel button" column */}</th>
                        <th>Quantity ({this.props.quoteSymbol})</th>
                        <th>Price ({this.props.baseSymbol})</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        this.props.orders.map(orderEntry)
                    }
                    </tbody>
                </table>
            );
        }
    }
}

export default MyOpenOrders;
