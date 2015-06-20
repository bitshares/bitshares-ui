var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";
import WalletApi from "rpc_api/WalletApi";

let subs = {};
let wallet_api = new WalletApi();

class MarketsActions {

    changeBase(market) {
        this.dispatch(market);
    }

    subscribeMarket(base, quote) {
        let subID = quote.id + "_" + base.id;
        console.log("sub to market:", subID);

        let shorts_available = quote.market_asset && quote.bitasset_data.options.short_backing_asset;

        let subscription = (subResult) => {
            console.log("markets subscription result:", subResult);
            let shortPromise = null,
                callPromise = null,
                settlePromise = null;

            if (shorts_available) {
                // shortPromise = Apis.instance().db_api().exec("get_short_orders", [
                //     quote.id, 100
                // ]);
                callPromise = Apis.instance().db_api().exec("get_call_orders", [
                    quote.id, 100
                ]);
                settlePromise = Apis.instance().db_api().exec("get_settle_orders", [
                    quote.id, 100
                ]);
            }

            Promise.all([
                    Apis.instance().db_api().exec("get_limit_orders", [
                        base.id, quote.id, 100
                    ]),
                    shortPromise,
                    callPromise,
                    settlePromise
                ])
                .then(results => {
                    this.dispatch({
                        limits: results[0],
                        shorts: results[1],
                        calls: results[2],
                        settles: results[3],
                        market: subID,
                        base: base,
                        quote: quote
                    });
                }).catch((error) => {
                    console.log("Error in MarketsActions.subscribeMarket: ", error);
                });
        };

        if (!subs[subID]) {

            let shortPromise = null,
                callPromise = null,
                settlePromise = null;

            if (shorts_available) {
                // shortPromise = Apis.instance().db_api().exec("get_short_orders", [
                //     quote.id, 100
                // ]);
                callPromise = Apis.instance().db_api().exec("get_call_orders", [
                    quote.id, 100
                ]);
                settlePromise = Apis.instance().db_api().exec("get_settle_orders", [
                    quote.id, 100
                ]);
            }

            return Promise.all([
                    Apis.instance().db_api().exec("subscribe_to_market", [
                        subscription, base.id, quote.id
                    ]),
                    Apis.instance().db_api().exec("get_limit_orders", [
                        base.id, quote.id, 100
                    ]),
                    shortPromise,
                    callPromise,
                    settlePromise
                ])
                .then((results) => {
                    console.log("market subscription success:", results[0]);
                    subs[subID] = true;

                    this.dispatch({
                        limits: results[1],
                        shorts: results[2],
                        calls: results[3],
                        settles: results[4],
                        market: subID,
                        base: base,
                        quote: quote
                    });

                }).catch((error) => {
                    console.log("Error in MarketsActions.subscribeMarket: ", error);
                });
        }
        return Promise.resolve(true);
    }

    unSubscribeMarket(quote, base) {
        let subID = quote + "_" + base;
        console.log("unSubscribeMarket:", subID);
        if (subs[subID]) {
            return Apis.instance().db_api().exec("unsubscribe_from_market", [
                    quote, base
                ])
                .then((unSubResult) => {
                    console.log(subID, "market unsubscription success:", unSubResult);
                    delete subs[subID];
                }).catch((error) => {
                    console.log("Error in MarketsActions.unSubscribeMarket: ", error);
                });
        }
        return Promise.resolve(true);
    }

    getMarkets() {
        // return Apis.instance().db_api().exec("get_objects", [
        //     [id]
        // ]).then((result) => {
        //     this.dispatch(result[0]);
        // }).catch((error) => {
        //     console.log("Error in AssetStore.updateAsset: ", error);
        // });
    }

    // TODO: What prevents a caller from entering someone else's sellAccount in the "seller" field?
    createLimitOrder(account, sellAmount, sellAssetID, buyAmount, buyAssetID, expiration, isFillOrKill) {
        var epochTime = new Date().getTime();
        var order = {
            expiration: expiration,
            for_sale: sellAmount,
            id: "unknown", // order ID unknown until server reply. TODO: populate ASAP, for cancels. Is never populated
            sell_price: {
                base: {
                    amount: sellAmount,
                    asset_id: sellAssetID
                },
                quote: {
                    amount: buyAmount,
                    asset_id: buyAssetID
                }
            },
            seller: account
        };

        console.log("sellamount " + sellAmount + ". sellID " + sellAssetID + ". buyAmount " + buyAmount + ". buyID " + buyAssetID);

        // TODO: enable the optimistic dispatch. It causes the order to appear twice, due to the subscription to market
        // this.dispatch({newOrderID: epochTime, order: order});
        var tr = wallet_api.new_transaction();

        tr.add_type_operation("limit_order_create", {
            "seller": account,
            "amount_to_sell": {
                "amount": sellAmount,
                "asset_id": sellAssetID
            },
            "min_to_receive": {
                "amount": buyAmount,
                "asset_id": buyAssetID
            },
            "expiration": expiration,
            "fill_or_kill": isFillOrKill
        });
        wallet_api.sign_and_broadcast(tr).then(result => {
                console.log("order result:", result);
                // TODO: update order ID from the server's response, if possible
            })
            .catch(error => {
                console.log("order error:", error);
                this.dispatch({
                    failedOrderID: epochTime
                });
            });
    }

    // TODO: What prevents a caller from entering someone else's order number in the "order" field?
    cancelLimitOrder(accountID, orderID) {
        console.log("cancel action:", accountID, orderID);
        this.dispatch({
            newOrderID: orderID
        });
        var tr = wallet_api.new_transaction();
        tr.add_type_operation("limit_order_cancel", {
            "fee_paying_account": accountID,
            "order": orderID
        });
        wallet_api.sign_and_broadcast(tr).then(result => {
                console.log("cancel result:", result);
            })
            .catch(error => {
                console.log("cancel error:", error);
                this.dispatch({
                    failedOrderID: orderID
                });
            });
    }
}

module.exports = alt.createActions(MarketsActions);
