var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "../stores/WalletDb";
import {operations} from "chain/chain_types";
import ChainStore from "api/ChainStore";
let ops = Object.keys(operations);

let subs = {};
let wallet_api = new WalletApi();
let orderCounter = -1;
let lastExpiration;

let addSeconds = (expiration) => {
    let newExpiration;

    if (lastExpiration !== null && lastExpiration !== expiration) { // Orders were not placed in the same minute, reset the counter
        orderCounter = -1;
        newExpiration = `${expiration}00`;
    }
    else { // Orders placed in the same minute, use counter to create 'unique' seconds
        orderCounter++;
        if (orderCounter === 59) { // Reset if the user places 60 orders in one minute, the first order should've failed by then anyway
            orderCounter = 0;
        }
        if (orderCounter < 10) {
            newExpiration = `${expiration}0${orderCounter}`;
        } else {
            newExpiration = `${expiration}${orderCounter}`;
        }
    }

    lastExpiration = expiration;
    return newExpiration; 
};

class MarketsActions {

    changeBase(market) {
        this.dispatch(market);
    }

    changeBucketSize(size) {
        this.dispatch(size);
    }

    subscribeMarket(base, quote, bucketSize) {
        let subID = quote.get("id") + "_" + base.get("id");
        // console.log("sub to market:", subID);

        let isMarketAsset = false, marketAsset, inverted = false;

        if (quote.get("bitasset") && base.get("id") === "1.3.0") {
            isMarketAsset = true;
            marketAsset = {id: quote.get("id")}
        } else if (base.get("bitasset") && quote.get("id") === "1.3.0") {
            inverted = true;
            isMarketAsset = true;
            marketAsset = {id: base.get("id")};
        }

        let subscription = (subResult) => {
            // console.log("markets subscription result:", subResult);
            let callPromise = null,
                settlePromise = null;

            if (isMarketAsset) {
                callPromise = Apis.instance().db_api().exec("get_call_orders", [
                    marketAsset.id, 100
                ]);
                settlePromise = Apis.instance().db_api().exec("get_settle_orders", [
                    marketAsset.id, 100
                ]);
            }

            let foundFill = false, fillOrders = [];
            for (var i = 0; i < subResult[0].length; i++) {
                if (ops[subResult[0][i][0][0]] === "fill_order") {
                    foundFill = true;
                    fillOrders.push(subResult[0][i]);
                }
            }
            if (foundFill) {
                this.dispatch({
                    fillOrders: fillOrders,
                    base: base,
                    quote: quote
                });
            }

            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 10);

            Promise.all([
                    Apis.instance().db_api().exec("get_limit_orders", [
                        base.get("id"), quote.get("id"), 100
                    ]),
                    callPromise,
                    settlePromise,
                    Apis.instance().history_api().exec("get_market_history", [
                        base.get("id"), quote.get("id"), bucketSize, startDate.toISOString().slice(0, -5), endDate.toISOString().slice(0, -5)
                    ])
                ])
                .then(results => {
                    this.dispatch({
                        limits: results[0],
                        calls: results[1],
                        settles: results[2],
                        price: results[3],
                        market: subID,
                        base: base,
                        quote: quote,
                        inverted: inverted
                    });
                }).catch((error) => {
                    console.log("Error in MarketsActions.subscribeMarket: ", error);
                });
        };

        if (!subs[subID]) {

            let callPromise = null,
                settlePromise = null;

            if (isMarketAsset) {
                callPromise = Apis.instance().db_api().exec("get_call_orders", [
                    marketAsset.id, 100
                ]);
                settlePromise = Apis.instance().db_api().exec("get_settle_orders", [
                    marketAsset.id, 100
                ]);
            }

            let startDate = new Date();
            let endDate = new Date();
            startDate.setDate(startDate.getDate() - 10);
            return Promise.all([
                    Apis.instance().db_api().exec("subscribe_to_market", [
                        subscription, base.get("id"), quote.get("id")
                    ]),
                    Apis.instance().db_api().exec("get_limit_orders", [
                        base.get("id"), quote.get("id"), 100
                    ]),
                    callPromise,
                    settlePromise,
                    Apis.instance().history_api().exec("get_market_history", [
                        base.get("id"), quote.get("id"), bucketSize, startDate.toISOString().slice(0, -5), endDate.toISOString().slice(0, -5)
                    ])
                ])
                .then((results) => {
                    // console.log("market subscription success:", results[0], results);
                    subs[subID] = true;

                    this.dispatch({
                        limits: results[1],
                        calls: results[2],
                        settles: results[3],
                        price: results[4],
                        market: subID,
                        base: base,
                        quote: quote,
                        inverted: inverted
                    });

                }).catch((error) => {
                    console.log("Error in MarketsActions.subscribeMarket: ", error);
                });
        }
        return Promise.resolve(true);
    }

    unSubscribeMarket(quote, base) {
        let subID = quote + "_" + base;
        if (subs[subID]) {
            return Apis.instance().db_api().exec("unsubscribe_from_market", [
                    quote, base
                ])
                .then((unSubResult) => {
                    this.dispatch({unSub: true});
                    delete subs[subID];
                    
                }).catch((error) => {
                    subs[subID] = true;
                    this.dispatch({unSub: false, market: subID});
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

    createLimitOrder(account, sellAmount, sellAssetID, buyAmount, buyAssetID, expiration, isFillOrKill) {
        // let uniqueExpiration = addSeconds(expiration);
        // console.log("create limit order:", expiration, "unique expiration:", uniqueExpiration);

        // var order = {
        //     expiration: uniqueExpiration,
        //     for_sale: sellAmount,
        //     id: "unknown", // order ID unknown until server reply. TODO: populate ASAP, for cancels. Is never populated
        //     sell_price: {
        //         base: {
        //             amount: sellAmount,
        //             asset_id: sellAssetID
        //         },
        //         quote: {
        //             amount: buyAmount,
        //             asset_id: buyAssetID
        //         }
        //     },
        //     seller: account
        // };

        // console.log("sellamount " + sellAmount + ". sellID " + sellAssetID + ". buyAmount " + buyAmount + ". buyID " + buyAssetID);

        // this.dispatch({newOrder: order});

        // TODO: enable the optimistic dispatch. It causes the order to appear twice, due to the subscription to market
        // this.dispatch({newOrderID: epochTime, order: order});
        var tr = wallet_api.new_transaction();

        let sell_asset = ChainStore.getAsset( sellAssetID ).toJS();
        console.log( "sell asset: ", sell_asset, sellAssetID );
        let fee_asset_id = sellAssetID;
        if( sell_asset.options.core_exchange_rate.base.asset_id == "1.3.0" && sell_asset.options.core_exchange_rate.quote.asset_id == "1.3.0" )
           fee_asset_id = "1.3.0";

        tr.add_type_operation("limit_order_create", {
            fee: {
                amount: 0,
                asset_id: fee_asset_id
            },
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
        return WalletDb.process_transaction(tr, null, true).then(result => {
            return true;
        })
            .catch(error => {
                console.log("order error:", error);
                return {error};
            });
    }

    cancelLimitOrder(accountID, orderID) {
        // console.log("cancel action:", accountID, orderID);
        // this.dispatch({
        //     newOrderID: orderID
        // });
        var tr = wallet_api.new_transaction();
        tr.add_type_operation("limit_order_cancel", {
            fee: {
                amount: 0,
                asset_id: 0
            },
            "fee_paying_account": accountID,
            "order": orderID
        });
        return WalletDb.process_transaction(tr, null, true)
        .catch(error => {
            console.log("cancel error:", error);
        });
    }

    cancelLimitOrderSuccess(orderID) {
        this.dispatch(orderID);
    }

    closeCallOrderSuccess(orderID) {
        this.dispatch(orderID);
    }

    callOrderUpdate(order) {
        this.dispatch(order);
    }

    // addMarket(quote, base) {
    //     this.dispatch({quote, base});
    // }

    // removeMarket(quote, base) {
    //     this.dispatch({quote, base});
    // }
}

module.exports = alt.createActions(MarketsActions);
