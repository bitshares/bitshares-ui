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
        let orderRows = null, quotePrecision, basePrecision;

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

            orderRows = orders.filter(a => {
                return a.seller === account; 
            }).sort((a, b) => {
                let dataA = getOrderData(a);
                let dataB = getOrderData(b);

                if (dataB.price > dataA.price) {
                    return -1;
                } else if (dataA.price > dataB.price) {
                    return 1;
                }
                return 0;
            }).map(order => {
                let data = getOrderData(order);

                let tdClass = classNames({orderHistoryBid: !data.isAsk, orderHistoryAsk: data.isAsk});
                return (
                     <tr key={order.id}>
                        <td className={tdClass}>{(data.buy.amount / quotePrecision).toFixed(3)}</td>
                        <td>{data.price.toFixed(3)}</td>
                        <td>
                            <a onClick={this.props.onCancel.bind(this, order.id)}>
                                <Icon name="cross-circle" fillClass="fill-black" />
                            </a>
                        </td>                        
                        {/*<td><FormattedDate
                            value={order.expiration}
                            formats={intlData.formats}
                            format="short"
                            />
                        </td>*/}
                    </tr>
                    );
            }).toArray();
        }
        return (
            <table className="table order-table my-orders">
                <thead>
                <tr>
                    <th>Amount</th>
                    <th>Price</th>
                    <th>{/* "Cancel button" column */}</th>
                    {/*<th>Expiration</th>*/}
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
