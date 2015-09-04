import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import {OrderRow, TableHeader} from "../Exchange/MyOpenOrders";
import market_utils from "common/market_utils";
import counterpart from "counterpart";
import MarketsActions from "actions/MarketsActions";
import notify from "actions/NotificationActions";
import LoadingIndicator from "../LoadingIndicator";

class AccountOrders extends React.Component {

    _cancelLimitOrder(orderID, e) {
        e.preventDefault();
        console.log("canceling limit order:", orderID);
        let {account_name, cachedAccounts, assets} = this.props;
        let account = cachedAccounts.get(account_name);
        MarketsActions.cancelLimitOrder(
            account.id,
            orderID // order id to cancel
        ).then(result => {
            if (!result) {
                notify.addNotification({
                        message: `Failed to cancel limit order ${orderID}`,
                        level: "error"
                    });
            }
        });
    }

    render() {
        let {account_name, assets, account} = this.props;
        // let account = cachedAccounts.get(account_name);
        let cancel = counterpart.translate("account.perm.cancel");

        let markets = {};

        let accountExists = true;
        if (!account) {
            return <LoadingIndicator type="circle"/>;
        } else if (account.notFound) {
            accountExists = false;
        } 
        if (!accountExists) {
            return <div className="grid-block"><h5><Translate component="h5" content="account.errors.not_found" name={account_name} /></h5></div>;
        }

        let orders = account.get("orders").map(order => {
            let base = assets.get(order.sell_price.base.asset_id);
            let quote = assets.get(order.sell_price.quote.asset_id);

            let marketID = quote.id < base.id ? `${quote.symbol}_${base.symbol}` : `${base.symbol}_${quote.symbol}`;
            if (!markets[marketID]) {
                markets[marketID] = {
                    base: {id: base.id, symbol: base.symbol, precision: base.precision},
                    quote: {id: quote.id, symbol: quote.symbol, precision: quote.precision}
                };
            }

            return <OrderRow
                        key={order.id}
                        order={order} base={markets[marketID].base}
                        quote={markets[marketID].quote} cancel_text={cancel}
                        showSymbols={true}
                        invert={true}
                        onCancel={this._cancelLimitOrder.bind(this, order.id)}/>;
        });

        return (
            <div className="grid-block">
                <div className="grid-content small-offset-1 small-8">
                    <table className="table table-striped text-right ">
                        <TableHeader type="sell"/>
                        <tbody>
                            {orders}
                        </tbody>
                    </table>
                </div>

            </div>
        );
    }
}

AccountOrders.defaultProps = {
    account_name: "",
    cachedAccounts: {},
    assets: {}
};

AccountOrders.propTypes = {
    account_name: PropTypes.string.isRequired,
    cachedAccounts: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired
};

export default AccountOrders;
