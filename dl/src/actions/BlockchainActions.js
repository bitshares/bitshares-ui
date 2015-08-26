var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";

let subs = {
    globals: false
};

let latestBlocks = {};

class BlockchainActions {

    unSubscribeGlobals() {
        if (subs.globals) {
            Apis.instance().db_api().exec("unsubscribe_from_objects", [
                    ["2.0.0", "2.1.0"]
                ])
                .then((unSubResult) => {
                    console.log("unsubscription success:", unSubResult);
                    if (unSubResult) {
                        subs.globals = false;
                    }
                }).catch((error) => {
                    console.log("Error in BlockchainActions.subscribeDynGlobal unsubscribe: ", error);
                });
        }
    }

    subscribeGlobals() {
        let subscription = (result) => {
            this.dispatch(result);
        };

        if (!subs.globals) {
            return Promise.all([
                    Apis.instance().db_api().exec("subscribe_to_objects", [
                        subscription, ["2.0.0", "2.1.0"]
                    ]),
                    Apis.instance().db_api().exec("get_objects", [
                        ["2.0.0", "2.1.0"]
                    ])
                ])
                .then((result) => {
                    console.log("global subscription success:", result[0]);
                    if (result[0]) {
                        subs.globals = true;
                    }
                    this.dispatch(result[1]);
                }).catch((error) => {
                    console.log("Error in BlockchainActions.subscribeDynGlobal subscribe: ", error);
                });
        }
        return Promise.resolve(true);
    }

    getLatest(height) {
        if (!latestBlocks[height]) {
            latestBlocks[height] = true;
            Apis.instance().db_api().exec("get_block", [
                    height
                ])
                .then((result) => {
                    if (!result) {
                        return;
                    }
                    result.id = height; // The returned object for some reason does not include the block height..
                    this.dispatch(result);
                }).catch((error) => {
                    console.log("Error in BlockchainActions.getLatest: ", error);
                });
        }
    }

    getBlock(height) {
        Apis.instance().db_api().exec("get_block", [
                height
            ])
            .then((result) => {
                if (!result) {
                    return;
                }
                result.id = height; // The returned object for some reason does not include the block height..
                this.dispatch(result);
            }).catch((error) => {
                console.log("Error in BlockchainActions.getBlock: ", error);
            });
    }

    updateRpcConnectionStatus(status) {
        this.dispatch(status);
    }
}

const BlockchainActionsInstance = alt.createActions(BlockchainActions)
Apis.setRpcConnectionStatusCallback(BlockchainActionsInstance.updateRpcConnectionStatus);

module.exports = BlockchainActionsInstance;
