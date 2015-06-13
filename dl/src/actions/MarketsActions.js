var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";
import WalletApi from "rpc_api/WalletApi";

let subs = {};
let wallet_api = new WalletApi();

class MarketsActions {

    subscribeMarket(idA, idB, mia) {
        let subID = idA + "_" + idB;

        let subscription = (result) => {
            console.log("markets subscription result:", result);
            this.dispatch({
                sub: result[0]
            });
        };

        if (!subs[subID]) {
            let shortPromise = mia ? 
                Apis.instance().db_api().exec("get_short_orders", [
                    idB, 100
                ]) :
                null;

            return Promise.all([
                    Apis.instance().db_api().exec("subscribe_to_market", [
                        subscription, idA, idB
                    ]),
                    Apis.instance().db_api().exec("get_limit_orders", [
                        idA, idB, 100
                    ]),
                    shortPromise
                ])
                .then((result) => {
                    console.log("market subscription success:", result[0]);
                    subs[subID] = true;
                    this.dispatch({
                        limits: result[1],
                        shorts: result[2],
                        market: subID
                    });
                }).catch((error) => {
                    console.log("Error in MarketsActions.subscribeMarket: ", error);
                });
        }
        return Promise.resolve(true);
    }

    unSubscribeMarket(idA, idB) {
        let subID = idA + "_" + idB;

        if (subs[subID]) {
            return Apis.instance().db_api().exec("unsubscribe_from_market", [
                    idA, idB
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

    // TODO: security. What prevents a caller from entering someone else's sellAccount in the "seller" field?
    createLimitOrder(account, feeAmount, feeAssetId, sellAmount, sellAssetId, buyAmount, buyAssetId, expiration, isFillOrKill) {
        var tr = wallet_api.new_transaction();
        tr.add_type_operation("limit_order_create", {
            "fee": { "amount": feeAmount, "asset_id": feeAssetId },
            "seller": account,
            "amount_to_sell": { "amount": sellAmount,"asset_id": sellAssetId },
            "min_to_receive": { "amount": buyAmount,"asset_id": buyAssetId },
            "expiration": expiration,
            "fill_or_kill": isFillOrKill
        });
        wallet_api.sign_and_broadcast(tr);
    }

    // TODO: What prevents a caller from entering someone else's order number in the "order" field?
    cancelLimitOrder(accountID, feeAmount, feeAssetID, orderID) {
        var tr = wallet_api.new_transaction();
        tr.add_type_operation("limit_order_cancel", {
            "fee": { "amount": feeAmount, "asset_id": feeAssetID },
            "fee_paying_account": accountID,
            "order": orderID
        });
        wallet_api.sign_and_broadcast(tr);
    }
}

module.exports = alt.createActions(MarketsActions);
