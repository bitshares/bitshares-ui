import React from "react";
import {OrderRow, TableHeader} from "../Exchange/MyOpenOrders";
import counterpart from "counterpart";
import MarketsActions from "actions/MarketsActions";
import {ChainStore} from "bitsharesjs/es";
import { LimitOrder } from "common/MarketClasses";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import marketUtils from "common/market_utils";

class AccountOrders extends React.Component {

    _cancelLimitOrder(orderID, e) {
        e.preventDefault();

        MarketsActions.cancelLimitOrder(
            this.props.account.get("id"),
            orderID // order id to cancel
        ).catch(err => {
            console.log("cancel order error:", err);
        });
    }

    onFlip(marketId) {
        let setting = {};
        setting[marketId] = !this.props.marketDirections.get(marketId);
        SettingsActions.changeMarketDirection(setting);
    }

    render() {
        let {account, marketDirections} = this.props;
        let cancel = counterpart.translate("account.perm.cancel");
        let markets = {};

        let marketOrders ={};

        if (!account.get("orders")) {
            return null;
        }
        account.get("orders").forEach(orderID => {
            let order = ChainStore.getObject(orderID).toJS();
            let base = ChainStore.getAsset(order.sell_price.base.asset_id);
            let quote = ChainStore.getAsset(order.sell_price.quote.asset_id);

            if (base && quote) {
                let assets = {
                    [base.get("id")]: {precision: base.get("precision")},
                    [quote.get("id")]: {precision: quote.get("precision")}
                };
                // let baseID = parseInt(order.sell_price.base.asset_id.split(".")[2], 10);
                // let quoteID = parseInt(order.sell_price.quote.asset_id.split(".")[2], 10);


                // let marketID = quoteID > baseID ? `${quote.get("symbol")}_${base.get("symbol")}` : `${base.get("symbol")}_${quote.get("symbol")}`;
                const {marketID} = marketUtils.getMarketID(base, quote);
                const direction = marketDirections.get(marketID);

                if (!markets[marketID]) {
                    if (direction) {
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
                let limitOrder = new LimitOrder(order, assets, markets[marketID].quote.id);

                let marketBase = ChainStore.getAsset(markets[marketID].base.id);
                let marketQuote = ChainStore.getAsset(markets[marketID].quote.id);

                if (!marketOrders[marketID]) {
                    marketOrders[marketID] = [];
                }

                marketOrders[marketID].push(
                    <OrderRow
                        ref={markets[marketID].base.symbol}
                        key={order.id}
                        order={limitOrder}
                        base={marketBase}
                        quote={marketQuote}
                        cancel_text={cancel}
                        showSymbols={false}
                        invert={true}
                        onCancel={this._cancelLimitOrder.bind(this, order.id)}
                        price={limitOrder.getPrice()}
                        dashboard
                        isMyAccount={this.props.isMyAccount}
                        settings={this.props.settings}
                        onFlip={this.onFlip.bind(this, marketID)}
                    />
                );
            }
        });

        let tables = [];

        let marketIndex = 0;
        for (let market in marketOrders) {
            if (marketOrders[market].length) {
                tables.push(
                    <tbody key={market}>
                        {/* {marketIndex > 0 ? <tr><td colSpan={this.props.isMyAccount ? "7" : "6"}><span style={{visibility: "hidden"}}>H</span></td></tr> : null} */}
                        {marketOrders[market].sort((a, b) => {
                            return a.props.price - b.props.price;
                        })}
                    </tbody>
                );
                marketIndex++;
            }
        }

        return (
            <div className="grid-content no-overflow no-padding" style={{paddingBottom: 15}}>
                <table className="table table-striped dashboard-table">
                    <TableHeader settings={this.props.settings} dashboard isMyAccount={this.props.isMyAccount}/>
                    {tables}
                    {this.props.children}
                </table>
            </div>
        );
    }
}

AccountOrders = connect(AccountOrders, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            marketDirections: SettingsStore.getState().marketDirections
        };
    }
});

export default AccountOrders;
