var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";

let subs = {
    globals: false
};

let latestBlocks = {};

class BlockchainActions {

    getLatest(height, maxBlock) {
        // let start = new Date();
        if (!latestBlocks[height] && maxBlock) {
            latestBlocks[height] = true;
            Apis.instance().db_api().exec("get_block", [
                    height
                ])
                .then((result) => {
                    if (!result) {
                        return;
                    }
                    result.id = height; // The returned object for some reason does not include the block height..
                    // console.log("time to fetch block #" + height,":", new Date() - start, "ms");
                    this.dispatch({block: result, maxBlock: maxBlock});
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

const BlockchainActionsInstance = alt.createActions(BlockchainActions);
Apis.setRpcConnectionStatusCallback(BlockchainActionsInstance.updateRpcConnectionStatus);

export default BlockchainActionsInstance;
