import alt from "alt-instance";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import {ChainStore} from "bitsharesjs/es";
import {Apis} from "bitsharesjs-ws";
import marketUtils from "common/market_utils";
import accountUtils from "common/account_utils";
import Immutable from "immutable";

let subs = {};
let currentBucketSize;
let marketStats = {};
let statTTL = 60 * 1 * 1000; // 1 minute

let cancelBatchIDs = Immutable.List();
let dispatchCancelTimeout = null;
let cancelBatchTime = 500;

let subBatchResults = Immutable.List();
let dispatchSubTimeout = null;
let subBatchTime = 500;

let currentMarket = null;

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

    getMarketStats(base, quote, refresh = false) {
        const {marketName, first, second} = marketUtils.getMarketName(
            base,
            quote
        );
        return dispatch => {
            if (base === quote) return;
            let now = new Date();

            if (marketStats[marketName] && !refresh) {
                if (now - marketStats[marketName].lastFetched < statTTL) {
                    return false;
                } else {
                    refresh = true;
                }
            }

            if (!marketStats[marketName] || refresh) {
                marketStats[marketName] = {
                    lastFetched: new Date()
                };

                Apis.instance()
                    .db_api()
                    .exec("get_ticker", [second.get("id"), first.get("id")])
                    .then(result => {
                        dispatch({
                            ticker: result,
                            market: marketName,
                            base: second,
                            quote: first
                        });
                    })
                    .catch(err => {
                        console.log("getMarketStats error:", err);
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
        currentMarket = base.get("id") + "_" + quote.get("id");

        let {isMarketAsset, marketAsset, inverted} = marketUtils.isMarketAsset(
            quote,
            base
        );

        const bucketCount = 200;
        // let lastLimitOrder = null;
        return dispatch => {
            let subscription = (marketId, subResult) => {
                /*
                ** When switching markets rapidly we might receive sub notifications
                ** from the previous markets, in that case disregard them
                */
                if (marketId !== currentMarket) {
                    return;
                }
                /* In the case of many market notifications arriving at the same time,
                * we queue them in a batch here and dispatch them all at once at a frequency
                * defined by "subBatchTime"
                */
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
                                    if (
                                        notification.length === 2 &&
                                        notification[0] &&
                                        notification[0][0] === 4
                                    ) {
                                        hasFill = true;
                                    }
                                }
                            });
                        });

                        let callPromise = null,
                            settlePromise = null;

                        // Only check for call and settle orders if either the base or quote is the CORE asset
                        if (isMarketAsset) {
                            callPromise = Apis.instance()
                                .db_api()
                                .exec("get_call_orders", [marketAsset.id, 300]);
                            settlePromise = Apis.instance()
                                .db_api()
                                .exec("get_settle_orders", [
                                    marketAsset.id,
                                    300
                                ]);
                        }

                        let startDate = new Date();
                        let startDate2 = new Date();
                        let startDate3 = new Date();
                        let endDate = new Date();
                        let startDateShort = new Date();
                        startDate = new Date(
                            startDate.getTime() -
                                bucketSize * bucketCount * 1000
                        );
                        startDate2 = new Date(
                            startDate2.getTime() -
                                bucketSize * bucketCount * 2000
                        );
                        startDate3 = new Date(
                            startDate3.getTime() -
                                bucketSize * bucketCount * 3000
                        );
                        endDate.setDate(endDate.getDate() + 1);
                        startDateShort = new Date(
                            startDateShort.getTime() - 3600 * 50 * 1000
                        );

                        subBatchResults = subBatchResults.clear();
                        dispatchSubTimeout = null;
                        // Selectively call the different market api calls depending on the type
                        // of operations received in the subscription update
                        Promise.all([
                            Apis.instance()
                                .db_api()
                                .exec("get_limit_orders", [
                                    base.get("id"),
                                    quote.get("id"),
                                    300
                                ]),
                            onlyLimitOrder ? null : callPromise,
                            onlyLimitOrder ? null : settlePromise,
                            !hasFill
                                ? null
                                : Apis.instance()
                                      .history_api()
                                      .exec("get_market_history", [
                                          base.get("id"),
                                          quote.get("id"),
                                          bucketSize,
                                          startDate.toISOString().slice(0, -5),
                                          endDate.toISOString().slice(0, -5)
                                      ]),
                            !hasFill
                                ? null
                                : Apis.instance()
                                      .history_api()
                                      .exec("get_fill_order_history", [
                                          base.get("id"),
                                          quote.get("id"),
                                          200
                                      ]),
                            !hasFill
                                ? null
                                : Apis.instance()
                                      .history_api()
                                      .exec("get_market_history", [
                                          base.get("id"),
                                          quote.get("id"),
                                          bucketSize,
                                          startDate2.toISOString().slice(0, -5),
                                          startDate.toISOString().slice(0, -5)
                                      ]),
                            !hasFill
                                ? null
                                : Apis.instance()
                                      .history_api()
                                      .exec("get_market_history", [
                                          base.get("id"),
                                          quote.get("id"),
                                          bucketSize,
                                          startDate3.toISOString().slice(0, -5),
                                          startDate2.toISOString().slice(0, -5)
                                      ]),
                            Apis.instance()
                                .db_api()
                                .exec("get_ticker", [
                                    base.get("id"),
                                    quote.get("id")
                                ])
                        ])
                            .then(results => {
                                const data1 = results[5] || [];
                                const data2 = results[6] || [];
                                dispatch({
                                    limits: results[0],
                                    calls: !onlyLimitOrder && results[1],
                                    settles: !onlyLimitOrder && results[2],
                                    price:
                                        hasFill &&
                                        data1.concat(data2.concat(results[3])),
                                    history: hasFill && results[4],
                                    market: subID,
                                    base: base,
                                    quote: quote,
                                    inverted: inverted,
                                    ticker: results[7]
                                });
                            })
                            .catch(error => {
                                console.log(
                                    "Error in MarketsActions.subscribeMarket: ",
                                    error
                                );
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
                    callPromise = Apis.instance()
                        .db_api()
                        .exec("get_call_orders", [marketAsset.id, 300]);
                    settlePromise = Apis.instance()
                        .db_api()
                        .exec("get_settle_orders", [marketAsset.id, 300]);
                }

                let startDate = new Date();
                let startDate2 = new Date();
                let startDate3 = new Date();
                let endDate = new Date();
                let startDateShort = new Date();
                startDate = new Date(
                    startDate.getTime() - bucketSize * bucketCount * 1000
                );
                startDate2 = new Date(
                    startDate2.getTime() - bucketSize * bucketCount * 2000
                );
                startDate3 = new Date(
                    startDate3.getTime() - bucketSize * bucketCount * 3000
                );
                startDateShort = new Date(
                    startDateShort.getTime() - 3600 * 50 * 1000
                );
                endDate.setDate(endDate.getDate() + 1);
                if (__DEV__) console.time("Fetch market data");
                return Promise.all([
                    Apis.instance()
                        .db_api()
                        .exec("subscribe_to_market", [
                            subscription.bind(
                                this,
                                base.get("id") + "_" + quote.get("id")
                            ),
                            base.get("id"),
                            quote.get("id")
                        ]),
                    Apis.instance()
                        .db_api()
                        .exec("get_limit_orders", [
                            base.get("id"),
                            quote.get("id"),
                            300
                        ]),
                    callPromise,
                    settlePromise,
                    Apis.instance()
                        .history_api()
                        .exec("get_market_history", [
                            base.get("id"),
                            quote.get("id"),
                            bucketSize,
                            startDate.toISOString().slice(0, -5),
                            endDate.toISOString().slice(0, -5)
                        ]),
                    Apis.instance()
                        .history_api()
                        .exec("get_market_history_buckets", []),
                    Apis.instance()
                        .history_api()
                        .exec("get_fill_order_history", [
                            base.get("id"),
                            quote.get("id"),
                            200
                        ]),
                    Apis.instance()
                        .history_api()
                        .exec("get_market_history", [
                            base.get("id"),
                            quote.get("id"),
                            bucketSize,
                            startDate2.toISOString().slice(0, -5),
                            startDate.toISOString().slice(0, -5)
                        ]),
                    Apis.instance()
                        .history_api()
                        .exec("get_market_history", [
                            base.get("id"),
                            quote.get("id"),
                            bucketSize,
                            startDate3.toISOString().slice(0, -5),
                            startDate2.toISOString().slice(0, -5)
                        ]),
                    Apis.instance()
                        .db_api()
                        .exec("get_ticker", [base.get("id"), quote.get("id")])
                ])
                    .then(results => {
                        const data1 = results[8] || [];
                        const data2 = results[7] || [];
                        subs[subID] = subscription;
                        if (__DEV__) console.timeEnd("Fetch market data");
                        dispatch({
                            limits: results[1],
                            calls: results[2],
                            settles: results[3],
                            price: data1.concat(data2.concat(results[4])),
                            buckets: results[5],
                            history: results[6],
                            market: subID,
                            base: base,
                            quote: quote,
                            inverted: inverted,
                            ticker: results[9]
                        });
                    })
                    .catch(error => {
                        console.log(
                            "Error in MarketsActions.subscribeMarket: ",
                            error
                        );
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
        return dispatch => {
            if (subs[subID]) {
                return Apis.instance()
                    .db_api()
                    .exec("unsubscribe_from_market", [subs[subID], quote, base])
                    .then(unSubResult => {
                        delete subs[subID];
                        dispatch({unSub: true});
                    })
                    .catch(error => {
                        subs[subID] = true;
                        console.log(
                            "Error in MarketsActions.unSubscribeMarket: ",
                            error
                        );
                        dispatch({unSub: false, market: subID});
                    });
            }
            return Promise.resolve(true);
        };
    }

    createLimitOrder(
        account,
        sellAmount,
        sellAsset,
        buyAmount,
        buyAsset,
        expiration,
        isFillOrKill,
        fee_asset_id
    ) {
        var tr = WalletApi.new_transaction();

        let feeAsset = ChainStore.getAsset(fee_asset_id);
        if (
            feeAsset.getIn([
                "options",
                "core_exchange_rate",
                "base",
                "asset_id"
            ]) === "1.3.0" &&
            feeAsset.getIn([
                "options",
                "core_exchange_rate",
                "quote",
                "asset_id"
            ]) === "1.3.0"
        ) {
            fee_asset_id = "1.3.0";
        }

        tr.add_type_operation("limit_order_create", {
            fee: {
                amount: 0,
                asset_id: fee_asset_id
            },
            seller: account,
            amount_to_sell: {
                amount: sellAmount,
                asset_id: sellAsset.get("id")
            },
            min_to_receive: {
                amount: buyAmount,
                asset_id: buyAsset.get("id")
            },
            expiration: expiration,
            fill_or_kill: isFillOrKill
        });

        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(result => {
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

    createLimitOrder2(order) {
        var tr = WalletApi.new_transaction();

        // let feeAsset = ChainStore.getAsset(fee_asset_id);
        // if( feeAsset.getIn(["options", "core_exchange_rate", "base", "asset_id"]) === "1.3.0" && feeAsset.getIn(["options", "core_exchange_rate", "quote", "asset_id"]) === "1.3.0" ) {
        //     fee_asset_id = "1.3.0";
        // }

        order = order.toObject();

        tr.add_type_operation("limit_order_create", order);

        return WalletDb.process_transaction(tr, null, true)
            .then(result => {
                return true;
            })
            .catch(error => {
                console.log("order error:", error);
                return {error};
            });
    }

    createPredictionShort(
        order,
        collateral,
        account,
        sellAmount,
        sellAsset,
        buyAmount,
        collateralAmount,
        buyAsset,
        expiration,
        isFillOrKill,
        fee_asset_id = "1.3.0"
    ) {
        var tr = WalletApi.new_transaction();

        // Set the fee asset to use
        fee_asset_id = accountUtils.getFinalFeeAsset(
            order.seller,
            "call_order_update",
            order.fee.asset_id
        );

        order.setExpiration();

        tr.add_type_operation("call_order_update", {
            fee: {
                amount: 0,
                asset_id: fee_asset_id
            },
            funding_account: order.seller,
            delta_collateral: collateral.toObject(),
            delta_debt: order.amount_for_sale.toObject(),
            expiration: order.getExpiration()
        });

        tr.add_type_operation("limit_order_create", order.toObject());

        return WalletDb.process_transaction(tr, null, true)
            .then(result => {
                return true;
            })
            .catch(error => {
                console.log("order error:", error);
                return {error};
            });
    }

    cancelLimitOrder(accountID, orderID) {
        // Set the fee asset to use
        let fee_asset_id = accountUtils.getFinalFeeAsset(
            accountID,
            "limit_order_cancel"
        );

        var tr = WalletApi.new_transaction();
        tr.add_type_operation("limit_order_cancel", {
            fee: {
                amount: 0,
                asset_id: fee_asset_id
            },
            fee_paying_account: accountID,
            order: orderID
        });
        return WalletDb.process_transaction(tr, null, true).catch(error => {
            console.log("cancel error:", error);
        });
    }

    cancelLimitOrders(accountID, orderIDs) {
        let fee_asset_id = accountUtils.getFinalFeeAsset(
            accountID,
            "limit_order_cancel"
        );

        var tr = WalletApi.new_transaction();
        orderIDs.forEach(id => {
            tr.add_type_operation("limit_order_cancel", {
                fee: {
                    amount: 0,
                    asset_id: fee_asset_id
                },
                fee_paying_account: accountID,
                order: id
            });
        });

        return WalletDb.process_transaction(tr, null, true).catch(error => {
            console.log("cancel error:", error);
        });
    }

    cancelLimitOrderSuccess(ids) {
        return dispatch => {
            /* In the case of many cancel orders being issued at the same time,
            * we batch them here and dispatch them all at once at a frequency
            * defined by "dispatchCancelTimeout"
            */
            if (!dispatchCancelTimeout) {
                cancelBatchIDs = cancelBatchIDs.concat(ids);
                dispatchCancelTimeout = setTimeout(() => {
                    dispatch(cancelBatchIDs.toJS());
                    dispatchCancelTimeout = null;
                    cancelBatchIDs = cancelBatchIDs.clear();
                }, cancelBatchTime);
            } else {
                cancelBatchIDs = cancelBatchIDs.concat(ids);
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
        return dispatch => {
            Apis.instance()
                .db_api()
                .exec("get_settle_orders", [asset, 100])
                .then(result => {
                    dispatch({
                        settles: result
                    });
                });
        };
    }

    toggleStars() {
        return true;
    }
}

export default alt.createActions(MarketsActions);
