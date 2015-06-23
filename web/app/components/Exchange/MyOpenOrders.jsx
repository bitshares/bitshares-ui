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
        let orderRows = null;

        if(orders.size > 0 && base && quote) {
            let quotePrecision = utils.get_asset_precision(quote.precision);
            let basePrecision = utils.get_asset_precision(base.precision);
            
            orderRows = orders.filter(a => {
                return a.seller === account; 
            }).sort((a, b) => {
                if (b.expiration > a.expiration) {
                    return 1;
                } else if (b.expiration < a.expiration) {
                    return -1;
                }
                return 0;
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
                        <td><FormattedDate
                            value={order.expiration}
                            formats={intlData.formats}
                            format="short"
                            />
                        </td>
                        {/*TODO: add expiration data  */}
                    </tr>
                    );
            }).toArray();
        }
        return (
            <table className="table order-table">
                <thead>
                <tr>
                    <th>{/* "Cancel button" column */}</th>
                    <th>Quantity ({quoteSymbol})</th>
                    <th>Price ({baseSymbol})</th>
                    <th>Expiration</th>
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
