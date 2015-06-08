var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";

let subs = {};

class MarketsActions {

    subscribeMarket(idA, idB) {
        let subID = idA + "_" + idB;
        let subscription = (result) => {
            console.log("markets subscription result:", result);
            this.dispatch({
                sub: result
            });
        };

        if (!subs[subID]) {
            subs[subID] = true;
            return Promise.all([
                    Apis.instance().db_api().exec("subscribe_to_market", [
                        subscription, idA, idB
                    ]),
                    Apis.instance().db_api().exec("get_limit_orders", [
                        idA, idB, 100
                    ])
                ])
                .then((result) => {
                    console.log("market subscription success:", result[0]);
                    this.dispatch({
                        limits: result[1],
                        shorts: result[2]
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
                .then((result) => {
                    console.log(subID, "market unsubscription success:", result);
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
}

module.exports = alt.createActions(MarketsActions);