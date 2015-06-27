import React from "react";
import Icon from "../Icon/Icon";
import Immutable from "immutable";
import classNames from "classnames";
import market_utils from "common/market_utils";
import utils from "common/utils";
import {FormattedDate} from "react-intl";
import intlData from "../Utility/intlData";

class MyOpenOrders extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
                nextProps.account.id !== this.props.account.id ||
                !Immutable.is(nextProps.orders, this.props.orders)
            );
    }

    render() {
        let {orders, account, base, quote, quoteSymbol, baseSymbol} = this.props;
        let bids = null, asks = null, quotePrecision, basePrecision;

        let getOrderData = function(order) {
            let isAsk = market_utils.isAsk(order, base);
            let {buy, sell} = market_utils.parseOrder(order, isAsk);
            let price = (sell.amount / basePrecision) / (buy.amount / quotePrecision);
            
            return {
                isAsk: isAsk,
                buy: buy,
                sell: sell,
                price: price
            };
        };

        if(orders.size > 0 && base && quote) {    
            quotePrecision = utils.get_asset_precision(quote.precision);
            basePrecision = utils.get_asset_precision(base.precision);

            bids = orders.filter(a => {
                return (a.seller === account && a.sell_price.quote.asset_id !== base.id); 
            }).sort((a, b) => {
                let dataA = getOrderData(a);
                let dataB = getOrderData(b);

                return dataB.price - dataA.price;
            }).map(order => {
                let data = getOrderData(order);

                let tdClass = classNames({orderHistoryBid: !data.isAsk, orderHistoryAsk: data.isAsk});
                return (
                     <tr key={order.id}>
                         <td>
                            <a onClick={this.props.onCancel.bind(this, order.id)}>
                                <Icon name="cross-circle" fillClass="fill-black" />
                            </a>
                        </td> 
                        <td><FormattedDate
                            value={order.expiration}
                            formats={intlData.formats}
                            format="short"
                            />
                        </td> 
                        <td>{((data.buy.amount / data.sell.amount) * order.for_sale / quotePrecision).toFixed(3)}</td>
                        <td className={tdClass}>{data.price.toFixed(3)}</td>
                      

                    </tr>
                    );
            }).toArray();

            asks = orders.filter(a => {
                return (a.seller === account && a.sell_price.quote.asset_id === base.id); 
            }).sort((a, b) => {
                let dataA = getOrderData(a);
                let dataB = getOrderData(b);

                return dataA.price - dataB.price;
            }).map(order => {
                let data = getOrderData(order);

                let tdClass = classNames({orderHistoryBid: !data.isAsk, orderHistoryAsk: data.isAsk});
                return (
                     <tr key={order.id}>
                        <td className={tdClass}>{data.price.toFixed(3)}</td>
                        <td>{(order.for_sale / quotePrecision).toFixed(3)}</td>
                        <td><FormattedDate
                            value={order.expiration}
                            formats={intlData.formats}
                            format="short"
                            />
                        </td>
                        <td>
                            <a onClick={this.props.onCancel.bind(this, order.id)}>
                                <Icon name="cross-circle" fillClass="fill-black" />
                            </a>
                        </td>  

                    </tr>
                    );
            }).toArray();
        }
        return (
            <div className="grid-content text-center">
                <table className="table order-table my-orders text-right">
                    <thead>
                    <tr>
                        <th style={{textAlign: "right"}}>{/* "Cancel button" column */}</th>
                        <th style={{textAlign: "right"}}>Expiration</th>
                        <th style={{textAlign: "right"}}>Amount</th>
                        <th style={{textAlign: "right"}}>Price</th>
                    </tr>
                    </thead>
                    <tbody>
                        {bids}
                    </tbody>
                </table>

                <table className="table order-table my-orders">
                    <thead>
                    <tr>
                        <th>Price</th>
                        <th>Amount</th>
                        <th>Expiration</th>
                        <th>{/* "Cancel button" column */}</th>
                    </tr>
                    </thead>
                    <tbody>
                        {asks}
                    </tbody>
                </table>
            </div>
        );
    }
}

export default MyOpenOrders;
