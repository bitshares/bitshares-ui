import React from "react";
import Immutable from "immutable";
import classNames from "classnames";
import market_utils from "common/market_utils";

class OpenOrders extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.orders, this.props.orders)
            );
    }

    render() {
        let {orders, account, quote, base} = this.props;
        let bids = null, asks = null;
        let high = 0, low = 0;

        if(orders.size > 0) {
            bids = orders.filter(a => {
                return a.sell_price.base.asset_id === base.id;
            }).sort((a, b) => {
                let {buy: a_buy, sell: a_sell} = market_utils.parseOrder(a, false);
                let {buy: b_buy, sell: b_sell} = market_utils.parseOrder(b, false);

                let a_price = (a_sell.amount / base.precision) / (a_buy.amount / quote.precision);
                let b_price = (b_sell.amount / base.precision) / (b_buy.amount / quote.precision);
                return a_price > b_price;
            }).map(order => {
                let isAskOrder = market_utils.isAsk(order, base);
                let {buy, sell} = market_utils.parseOrder(order, isAskOrder);
                let price = (sell.amount / base.precision) / (buy.amount / quote.precision);
                let tdClass = classNames({orderHistoryBid: !isAskOrder, orderHistoryAsk: isAskOrder});
                high = price;
                return (
                     <tr key={order.id}>
                        <td className={tdClass}>{buy.amount / quote.precision}</td>
                        <td>{price}</td>
                        {/*TODO: add expiration data <td>{order.expiration}</td> */}
                    </tr>
                    );
            }).toArray();

            let askIndex = 0;
            asks = orders.filter(a => {
                return a.sell_price.quote.asset_id === base.id;
            }).sort((a, b) => {
                let {buy: a_buy, sell: a_sell} = market_utils.parseOrder(a, true);
                let {buy: b_buy, sell: b_sell} = market_utils.parseOrder(b, true);

                let a_price = (a_sell.amount / base.precision) / (a_buy.amount / quote.precision);
                let b_price = (b_sell.amount / base.precision) / (b_buy.amount / quote.precision);
                return a_price > b_price;
            }).map(order => {
                let isAskOrder = market_utils.isAsk(order, base);
                let {buy, sell} = market_utils.parseOrder(order, isAskOrder);
                let price = (sell.amount / base.precision) / (buy.amount / quote.precision);
                let tdClass = classNames({orderHistoryBid: !isAskOrder, orderHistoryAsk: isAskOrder});
                if (askIndex === 0) {
                    low = price;
                }
                askIndex++;
                return (
                     <tr key={order.id}>
                        <td className={tdClass}>{buy.amount / quote.precision}</td>
                        <td>{price}</td>
                        {/*TODO: add expiration data <td>{order.expiration}</td> */}
                    </tr>
                    );
            }).toArray();
        }

        return (
                <table className="table">
                    <caption>OPEN ORDERS</caption>
                    <thead>
                    <tr>
                        <th>Quantity ({quote.symbol})</th>
                        <th>Price ({base.symbol})</th>
                    </tr>
                    </thead>
                    <tbody>
                            {bids}
                            <tr><td colSpan="2" className="text-center">Spread: {high > 0 && low > 0 ? low - high : 0} {base.symbol}</td></tr>
                            {asks}
                    </tbody>
                </table>
        );
    }
}

export default OpenOrders;
