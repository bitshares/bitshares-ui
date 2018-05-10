import Immutable from "immutable";
import alt from "alt-instance";
import BlockchainActions from "actions/BlockchainActions";
import {ChainStore} from "bitsharesjs/es";
// import {Block} from "./tcomb_structs";

class BlockchainStore {
    constructor() {
        // This might not need to be an immutable map, a normal structure might suffice..
        this.blocks = Immutable.Map();
        this.latestBlocks = Immutable.List();
        this.latestTransactions = Immutable.List();
        this.rpc_connection_status = null;
        this.no_ws_connection = false;

        this.bindListeners({
            onGetBlock: BlockchainActions.getBlock,
            onGetLatest: BlockchainActions.getLatest,
            onUpdateRpcConnectionStatus:
                BlockchainActions.updateRpcConnectionStatus
        });

        this.maxBlocks = 30;
    }

    onGetBlock(block) {
        if (!this.blocks.get(block.id)) {
            if (!/Z$/.test(block.timestamp)) {
                block.timestamp += "Z";
            }
            block.timestamp = new Date(block.timestamp);
            this.blocks = this.blocks.set(block.id, block);
        }
    }

    onGetLatest(payload) {
        let {block, maxBlock} = payload;
        if (typeof block.timestamp === "string") {
            if (!/Z$/.test(block.timestamp)) {
                block.timestamp += "Z";
            }
        }
        block.timestamp = new Date(block.timestamp);
        this.blocks = this.blocks.set(block.id, block);
        if (block.id > maxBlock - this.maxBlocks) {
            this.latestBlocks = this.latestBlocks.unshift(block);
            if (this.latestBlocks.size > this.maxBlocks) {
                this.latestBlocks = this.latestBlocks.pop();
            }

            if (block.transactions.length > 0) {
                block.transactions.forEach(trx => {
                    trx.block_num = block.id;
                    this.latestTransactions = this.latestTransactions.unshift(
                        trx
                    );
                });
            }

            if (this.latestTransactions.size > this.maxBlocks) {
                this.latestTransactions = this.latestTransactions.pop();
            }
        }
    }

    onUpdateRpcConnectionStatus(status) {
        let prev_status = this.rpc_connection_status;
        if (status === "reconnect") ChainStore.resetCache(false);
        else this.rpc_connection_status = status;
        if (prev_status === null && status === "error")
            this.no_ws_connection = true;
        if (this.no_ws_connection && status === "open")
            this.no_ws_connection = false;
        if (status === "closed") this.no_ws_connection = true;
    }
}

export default alt.createStore(BlockchainStore, "BlockchainStore");
