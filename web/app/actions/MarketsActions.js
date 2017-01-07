var alt = require("alt-instance");
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import {ChainStore} from "graphenejs-lib";
import {Apis} from "graphenejs-ws";
import marketUtils from "common/market_utils";
import accountUtils from "common/account_utils";
import Immutable from "immutable";

let subs = {};
let currentBucketSize;
let wallet_api = new WalletApi();
let marketStats = {};
let statTTL = 60 * 2 * 1000; // 2 minutes

let cancelBatchIDs = Immutable.List();
let dispatchCancelTimeout = null;
let cancelBatchTime = 500;

let subBatchResults = Immutable.List();
let dispatchSubTimeout = null;
let subBatchTime = 500;

function clearBatchTimeouts() {
    clearTimeout(dispatchCancelTimeout);
    clearTimeout(dispatchSubTimeout);
    dispatchCancelTimeout = null;
    dispatchSubTimeout = null;
}

class MarketsActions {

    changeBase(market) {
        clearBatchTimeouts();
        return market;
    }

    changeBucketSize(size) {
        return size;
    }

    getMarketStats(base, quote) {
        return (dispatch) => {
            let market = quote.get("id") + "_" + base.get("id");
            let marketName = quote.get("symbol") + "_" + base.get("symbol");
            let now = new Date();
            let endDate = new Date();
            let startDateShort = new Date();
            endDate.setDate(endDate.getDate() + 1);
            startDateShort = new Date(startDateShort.getTime() - 3600 * 50 * 1000);

            let refresh = false;

            if (marketStats[market]) {
                if ((now - marketStats[market].lastFetched) < statTTL) {
                    return false;
                } else {
                    refresh = true;
                }
            }

            if (!marketStats[market] || refresh) {
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

                    dispatch({history: result[0], last: result[1], market: marketName, base, quote});
                });
            }
        };
    }

    switchMarket() {
        return true;
    }

    subscribeMarket(base, quote, bucketSize) {
        clearBatchTimeouts();
        let subID = quote.get("id") + "_" + base.get("id");

        let {isMarketAsset, marketAsset, inverted} = marketUtils.isMarketAsset(quote, base);

        let bucketCount = 200;
        // let lastLimitOrder = null;
        return (dispatch) => {

            let subscription = (subResult) => {
                if (!dispatchSubTimeout) {
                    subBatchResults = subBatchResults.concat(subResult);

                    dispatchSubTimeout = setTimeout(() => {
                        let hasLimitOrder = false;
                        let onlyLimitOrder = true;
                        let hasFill = false;

                        // // We get two notifications for each limit order created, ignore the second one
                        // if (subResult.length === 1 && subResult[0].length === 1 && subResult[0][0] === lastLimitOrder) {
                        //     return;
                        // }

                        // Check whether the market had a fill order, and whether it only has a new limit order
                        subBatchResults.forEach(result => {

                            result.forEach(notification => {
                                if (typeof notification === "string") {
                                    let split = notification.split(".");
                                    if (split.length >= 2 && split[1] === "7") {
                                        hasLimitOrder = true;
                                    } else {
                                        onlyLimitOrder = false;
                                    }
                                } else {
                                    onlyLimitOrder = false;
                                    if (notification.length === 2 && notification[0] && notification[0][0] === 4) {
                                        hasFill = true;
                                    }
                                }
                            });

                        });

                        let callPromise = null,
                            settlePromise = null;

                        // Only check for call and settle orders if either the base or quote is the CORE asset
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
                        startDate = new Date(startDate.getTime() - bucketSize * bucketCount * 1000);
                        endDate.setDate(endDate.getDate() + 1);
                        startDateShort = new Date(startDateShort.getTime() - 3600 * 50 * 1000);

                        subBatchResults = subBatchResults.clear();
                        dispatchSubTimeout = null;
                        // Selectively call the different market api calls depending on the type
                        // of operations received in the subscription update
                        Promise.all([
                            Apis.instance().db_api().exec("get_limit_orders", [
                                base.get("id"), quote.get("id"), 100
                            ]),
                            onlyLimitOrder ? null : callPromise,
                            onlyLimitOrder ? null : settlePromise,
                            !hasFill ? null : Apis.instance().history_api().exec("get_market_history", [
                                base.get("id"), quote.get("id"), bucketSize, startDate.toISOString().slice(0, -5), endDate.toISOString().slice(0, -5)
                            ]),
                            !hasFill ? null : Apis.instance().history_api().exec("get_fill_order_history", [base.get("id"), quote.get("id"), 200]),
                            !hasFill ? null : Apis.instance().history_api().exec("get_market_history", [
                                base.get("id"), quote.get("id"), 3600, startDateShort.toISOString().slice(0, -5), endDate.toISOString().slice(0, -5)
                            ])
                        ])
                        .then(results => {
                            dispatch({
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
                    }, subBatchTime);
                } else {
                    subBatchResults = subBatchResults.concat(subResult);
                }

            };

            if (!subs[subID] || currentBucketSize !== bucketSize) {
                dispatch({switchMarket: true});
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
                startDate = new Date(startDate.getTime() - bucketSize * bucketCount * 1000);
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
                    Apis.instance().history_api().exec("get_fill_order_history", [base.get("id"), quote.get("id"), 200]),
                    Apis.instance().history_api().exec("get_market_history", [
                        base.get("id"), quote.get("id"), 3600, startDateShort.toISOString().slice(0, -5), endDate.toISOString().slice(0, -5)
                    ])
                ])
                .then((results) => {
                    subs[subID] = subscription;
                    dispatch({
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
        };

    }

    clearMarket() {
        clearBatchTimeouts();
        return true;
    }

    unSubscribeMarket(quote, base) {
        let subID = quote + "_" + base;
        clearBatchTimeouts();
        return (dispatch) => {
            if (subs[subID]) {
                return Apis.instance().db_api().exec("unsubscribe_from_market", [
                    subs[subID], quote, base
                ])
                    .then((unSubResult) => {
                        delete subs[subID];
                        dispatch({unSub: true});
                    }).catch((error) => {
                        subs[subID] = true;
                        console.log("Error in MarketsActions.unSubscribeMarket: ", error);
                        dispatch({unSub: false, market: subID});
                    });
            }
            return Promise.resolve(true);
        };
    }

    createLimitOrder(account, sellAmount, sellAsset, buyAmount, buyAsset, expiration, isFillOrKill, fee_asset_id) {

        var tr = wallet_api.new_transaction();

        let feeAsset = ChainStore.getAsset(fee_asset_id);
        if( feeAsset.getIn(["options", "core_exchange_rate", "base", "asset_id"]) === "1.3.0" && feeAsset.getIn(["options", "core_exchange_rate", "quote", "asset_id"]) === "1.3.0" ) {
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

        return (dispatch) => {
            return WalletDb.process_transaction(tr, null, true).then(result => {
                dispatch(true);
                return true;
            })
            .catch(error => {
                console.log("order error:", error);
                dispatch({error});
                return {error};
            });
        };
    }

    createLimitOrder2(order, fee_asset_id = "1.3.0") {
        var tr = wallet_api.new_transaction();

        let feeAsset = ChainStore.getAsset(fee_asset_id);
        if( feeAsset.getIn(["options", "core_exchange_rate", "base", "asset_id"]) === "1.3.0" && feeAsset.getIn(["options", "core_exchange_rate", "quote", "asset_id"]) === "1.3.0" ) {
            fee_asset_id = "1.3.0";
        }

        order.setExpiration();
        order = order.toObject();
        order.fee = {
            amount: 0,
            asset_id: fee_asset_id
        };

        tr.add_type_operation("limit_order_create", order);

        return WalletDb.process_transaction(tr, null, true).then(result => {
            return true;
        })
        .catch(error => {
            console.log("order error:", error);
            return {error};
        });
    }

    createPredictionShort(account, sellAmount, sellAsset, buyAmount, collateralAmount, buyAsset, expiration, isFillOrKill, fee_asset_id = "1.3.0") {

        var tr = wallet_api.new_transaction();

        // let fee_asset_id = sellAsset.get("id");
        // if( sellAsset.getIn(["options", "core_exchange_rate", "base", "asset_id"]) == "1.3.0" && sellAsset.getIn(["options", "core_exchange_rate", "quote", "asset_id"]) == "1.3.0" ) {
        //    fee_asset_id = "1.3.0";
        // }

        // Set the fee asset to use
        fee_asset_id = accountUtils.getFinalFeeAsset(account, "call_order_update", fee_asset_id);

        tr.add_type_operation("call_order_update", {
            "fee": {
                amount: 0,
                asset_id: fee_asset_id
            },
            "funding_account": account,
            "delta_collateral": {
                "amount": collateralAmount,
                "asset_id": "1.3.0"
            },
            "delta_debt": {
                "amount": sellAmount,
                "asset_id": sellAsset.get("id")
            }
        });

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
        // Set the fee asset to use
        let fee_asset_id = accountUtils.getFinalFeeAsset(accountID, "limit_order_cancel");

        var tr = wallet_api.new_transaction();
        tr.add_type_operation("limit_order_cancel", {
            fee: {
                amount: 0,
                asset_id: fee_asset_id
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
        return (dispatch) => {
            if (!dispatchCancelTimeout) {
                cancelBatchIDs = cancelBatchIDs.push(orderID);
                dispatchCancelTimeout = setTimeout(() => {
                    cancelBatchIDs = cancelBatchIDs.clear();
                    dispatchCancelTimeout = null;
                    dispatch(cancelBatchIDs.toJS());
                }, cancelBatchTime);
            } else {
                cancelBatchIDs = cancelBatchIDs.push(orderID);
            }
        };
    }

    closeCallOrderSuccess(orderID) {
        return orderID;
    }

    callOrderUpdate(order) {
        return order;
    }

    feedUpdate(asset) {
        return asset;
    }

    settleOrderUpdate(asset) {
        return (dispatch) => {
            Apis.instance().db_api().exec("get_settle_orders", [
                asset, 100
            ]).then(result => {
                dispatch({
                    settles: result
                });
            });
        };
    }

}

export default alt.createActions(MarketsActions);
