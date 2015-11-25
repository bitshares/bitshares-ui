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
import ChainStore from "api/ChainStore";
import MarketLink from "../Utility/MarketLink";

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

        let marketOrders ={};
        account.get("orders").forEach(order => {
            let base = ChainStore.getAsset(order.sell_price.base.asset_id);
            let quote = ChainStore.getAsset(order.sell_price.quote.asset_id);
            if (base && quote) {
                let baseID = parseInt(order.sell_price.base.asset_id.split(".")[2], 10);
                let quoteID = parseInt(order.sell_price.quote.asset_id.split(".")[2], 10);

                let marketID = quoteID > baseID ? `${quote.get("symbol")}_${base.get("symbol")}` : `${base.get("symbol")}_${quote.get("symbol")}`;

                if (!markets[marketID]) {
                    if (quoteID > baseID) {
                        markets[marketID] = {
                            base: {id: base.get("id"), symbol: base.get("symbol"), precision: base.get("precision")},
                            quote: {id: quote.get("id"), symbol: quote.get("symbol"), precision: quote.get("precision")}
                        };
                    } else {
                        markets[marketID] = {
                            base: {id: quote.get("id"), symbol: quote.get("symbol"), precision: quote.get("precision")},
                            quote: {id: base.get("id"), symbol: base.get("symbol"), precision: base.get("precision")}
                        };
                    }
                }

                let marketBase = ChainStore.getAsset(markets[marketID].base.id);
                let marketQuote = ChainStore.getAsset(markets[marketID].quote.id);

                if (!marketOrders[marketID]) {
                    marketOrders[marketID] = [];
                }
                marketOrders[marketID].push(
                    <OrderRow
                        ref={markets[marketID].base.symbol}
                        key={order.id}
                        order={order}
                        base={marketBase}
                        quote={marketQuote}
                        cancel_text={cancel}
                        showSymbols={false}
                        invert={true}
                        onCancel={this._cancelLimitOrder.bind(this, order.id)}
                    />
                );
            }
        });

        let tables = [];

        let marketIndex = 0;
        for (let market in marketOrders) {
            if (marketOrders[market].length) {
                tables.push(
                    <div style={marketIndex > 0 ? {paddingTop: "1rem"} : {}}>
                    <h5><MarketLink quote={markets[market].quote.id} base={markets[market].base.id} /></h5>
                    <table className="table table-striped text-right ">
                        <TableHeader baseSymbol={markets[market].base.symbol} quoteSymbol={markets[market].quote.symbol}/>
                        <tbody>
                            {marketOrders[market]}
                        </tbody>
                    </table>
                    </div>
                );
                marketIndex++;
            }
        }

        return (
            <div className="grid-block">
                <div className="grid-content small-12">
                    {tables}
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
