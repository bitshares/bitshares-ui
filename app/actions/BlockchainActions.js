import alt from "alt-instance";
import {Apis} from "bitsharesjs-ws";
import BlockchainStore from "../stores/BlockchainStore";
import {ChainStore} from "bitsharesjs/es";

let latestBlocks = {};

class BlockchainActions {
    getLatest(height, maxBlock) {
        // let start = new Date();
        return dispatch => {
            if (!latestBlocks[height] && maxBlock) {
                latestBlocks[height] = true;
                Apis.instance()
                    .db_api()
                    .exec("get_block", [height])
                    .then(result => {
                        if (!result) {
                            return;
                        }
                        result.id = height; // The returned object for some reason does not include the block height..
                        // console.log("time to fetch block #" + height,":", new Date() - start, "ms");

                        dispatch({block: result, maxBlock: maxBlock});
                    })
                    .catch(error => {
                        console.log(
                            "Error in BlockchainActions.getLatest: ",
                            error
                        );
                    });
            }
        };
    }

    getBlock(height) {
        return dispatch => {
            Apis.instance()
                .db_api()
                .exec("get_block", [height])
                .then(result => {
                    if (!result) {
                        return false;
                    }
                    result.id = height; // The returned object for some reason does not include the block height..

                    dispatch(result);
                })
                .catch(error => {
                    console.log("Error in BlockchainActions.getBlock: ", error);
                });
        };
    }

    /**
     * Returns the current blocktime, or exception if not yet available
     * @returns {Date}
     */
    getBlockTime() {
        let dynGlobalObject = ChainStore.getObject("2.1.0");
        if (dynGlobalObject) {
            let block_time = dynGlobalObject.get("time");
            if (!/Z$/.test(block_time)) {
                block_time += "Z";
            }
            return new Date(block_time);
        } else {
            throw new Error("Blocktime not available right now");
        }
    }

    /**
     * Returns the delta between the current time and the block time in seconds, or -1 if block time not available yet
     *
     * Note: Could be integrating properly with BlockchainStore to send out updates, but not necessary atp
     */
    getBlockTimeDelta() {
        try {
            let bt =
                (this.getBlockTime().getTime() +
                    ChainStore.getEstimatedChainTimeOffset()) /
                1000;
            let now = new Date().getTime() / 1000;
            return Math.abs(now - bt);
        } catch (err) {
            console.log(err);
            return -1;
        }
    }

    updateRpcConnectionStatus(status) {
        return status;
    }
}

const BlockchainActionsInstance = alt.createActions(BlockchainActions);
Apis.setRpcConnectionStatusCallback(
    BlockchainActionsInstance.updateRpcConnectionStatus
);

export default BlockchainActionsInstance;
