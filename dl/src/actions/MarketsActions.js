var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "../stores/WalletDb";
import {operations} from "chain/chain_types";
import ChainStore from "api/ChainStore";
let ops = Object.keys(operations);

let subs = {};
let currentBucketSize;
let wallet_api = new WalletApi();
let marketStats = {};
let statTTL = 60 * 5 * 1000; // 5 minutes

class MarketsActions {

    changeBase(market) {
        this.dispatch(market);
    }

    changeBucketSize(size) {
        this.dispatch(size);
    }

    getMarketStats(base, quote) {
        let market = quote.get("id") + "_" + base.get("id");
        let marketName = quote.get("symbol") + "_" + base.get("symbol");
        let now = new Date();
        let endDate = new Date();
        let startDateShort = new Date();
        endDate.setDate(endDate.getDate() + 1);
        startDateShort = new Date(startDateShort.getTime() - 3600 * 50 * 1000);

        if (marketStats[market]) {
            if ((now - marketStats[market].lastFetched) < statTTL) {
                return false;
            }
        }
        if (!marketStats[market]) {
            Promise.all([
                Apis.instance().history_api().exec("get_market_history", [
                    base.get("id"), quote.get("id"), 3600, startDateShort.toISOString().slice(0, -5), endDate.toISOString().slice(0, -5)
                ]),
                Apis.instance().history_api().exec("get_fill_order_history", [base.get("id"), quote.get("id"), 1])
            ])            
            .then(result => {
                marketStats[market] = {
                    lastFetched: new Date()
                };

                this.dispatch({history: result[0], last: result[1], market: marketName, base, quote});
            });
        }
    }

    subscribeMarket(base, quote, bucketSize) {

        let subID = quote.get("id") + "_" + base.get("id");

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
            let startDateShort = new Date();
            startDate = new Date(startDate.getTime() - bucketSize * 100 * 1000);
            endDate.setDate(endDate.getDate() + 1);
            startDateShort = new Date(startDateShort.getTime() - 3600 * 50 * 1000);
            Promise.all([
                    Apis.instance().db_api().exec("get_limit_orders", [
                        base.get("id"), quote.get("id"), 100
                    ]),
                    callPromise,
                    settlePromise,
                    Apis.instance().history_api().exec("get_market_history", [
                        base.get("id"), quote.get("id"), bucketSize, startDate.toISOString().slice(0, -5), endDate.toISOString().slice(0, -5)
                    ]),
                    Apis.instance().history_api().exec("get_fill_order_history", [base.get("id"), quote.get("id"), 100]),
                    Apis.instance().history_api().exec("get_market_history", [
                        base.get("id"), quote.get("id"), 3600, startDateShort.toISOString().slice(0, -5), endDate.toISOString().slice(0, -5)
                    ])
                ])
                .then(results => {
                    this.dispatch({
                        limits: results[0],
                        calls: results[1],
                        settles: results[2],
                        price: results[3],
                        history: results[4],
                        recent: results[5],
                        market: subID,
                        base: base,
                        quote: quote,
                        inverted: inverted
                    });
                }).catch((error) => {
                    console.log("Error in MarketsActions.subscribeMarket: ", error);
                });
        };

        if (!subs[subID] || currentBucketSize !== bucketSize) {
            this.dispatch({switchMarket: true});
            currentBucketSize = bucketSize;
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
            let startDateShort = new Date();
            startDate = new Date(startDate.getTime() - bucketSize * 100 * 1000);
            startDateShort = new Date(startDateShort.getTime() - 3600 * 50 * 1000);
            endDate.setDate(endDate.getDate() + 1);
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
                    ]),
                    Apis.instance().history_api().exec("get_market_history_buckets", []),
                    Apis.instance().history_api().exec("get_fill_order_history", [base.get("id"), quote.get("id"), 100]),
                    Apis.instance().history_api().exec("get_market_history", [
                        base.get("id"), quote.get("id"), 3600, startDateShort.toISOString().slice(0, -5), endDate.toISOString().slice(0, -5)
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
                        buckets: results[5],
                        history: results[6],
                        recent: results[7],
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

    clearMarket() {
        this.dipatch();
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

    createLimitOrder(account, sellAmount, sellAsset, buyAmount, buyAsset, expiration, isFillOrKill) {

        var tr = wallet_api.new_transaction();

        let fee_asset_id = sellAsset.get("id");
        if( sellAsset.getIn(["options", "core_exchange_rate", "base", "asset_id"]) == "1.3.0" && sellAsset.getIn(["options", "core_exchange_rate", "quote", "asset_id"]) == "1.3.0" ) {
           fee_asset_id = "1.3.0";
        }

        tr.add_type_operation("limit_order_create", {
            fee: {
                amount: 0,
                asset_id: fee_asset_id
            },
            "seller": account,
            "amount_to_sell": {
                "amount": sellAmount,
                "asset_id": sellAsset.get("id")
            },
            "min_to_receive": {
                "amount": buyAmount,
                "asset_id": buyAsset.get("id")
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

}

module.exports = alt.createActions(MarketsActions);
