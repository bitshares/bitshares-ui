import React from "react";
import Icon from "../Icon/Icon";
import Immutable from "immutable";
import classNames from "classnames";
import market_utils from "common/market_utils";
import utils from "common/utils";

class MyOpenOrders extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
                nextProps.account.id !== this.props.account.id ||
                !Immutable.is(nextProps.orders, this.props.orders)
            );
    }

    render() {
        let {orders, account, base, quote, quoteSymbol, baseSymbol} = this.props;
        let orderRows = null;

        if(orders.size > 0 && base && quote) {
            let quotePrecision = utils.get_asset_precision(quote.precision);
            let basePrecision = utils.get_asset_precision(base.precision);
            
            orderRows = orders.filter(a => {
                return a.seller === account; 
            }).sort((a, b) => {
                let a_id = parseInt(a.id.split(".")[2], 10);
                let b_id = parseInt(b.id.split(".")[2], 10);
                return b_id > a_id;
            }).map(order => {
                let isAskOrder = market_utils.isAsk(order, base);
                let {buy, sell} = market_utils.parseOrder(order, isAskOrder);
                let price = (sell.amount / basePrecision) / (buy.amount / quotePrecision);

                let tdClass = classNames({orderHistoryBid: !isAskOrder, orderHistoryAsk: isAskOrder});

                return (
                     <tr key={order.id}>
                        <td>
                            <a onClick={this.props.onCancel.bind(this, order.id)}>
                                <Icon name="cross-circle" fillClass="fill-black" />
                            </a>
                        </td>
                        <td className={tdClass}>{buy.amount / quotePrecision}</td>
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
                    <th>Quantity ({quoteSymbol})</th>
                    <th>Price ({baseSymbol})</th>
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
