var Immutable = require("immutable");
var alt = require("../alt-instance");
var BlockchainActions = require("../actions/BlockchainActions");
import BaseStore from "./BaseStore";
import {operations} from "chain/chain_types";
import ChainStore from "../api/ChainStore";

import {
    Block, GlobalObject, DynGlobalObject
}
from "./tcomb_structs";



class BlockchainStore extends BaseStore{
    constructor() {
        super();
        // This might not need to be an immutable map, a normal structure might suffice..
        this.blocks = Immutable.Map();
        this.latestBlocks = Immutable.List();
        this.latestTransactions = Immutable.List();
        this.dynGlobalObject = {};
        this.globalObject = {};
        this.rpc_connection_status = "open";

        this.bindListeners({
            onGetBlock: BlockchainActions.getBlock,
            onGetLatest: BlockchainActions.getLatest,
            onUpdateRpcConnectionStatus: BlockchainActions.updateRpcConnectionStatus
        });

        this._export("getFee");

        this.maxBlocks = 100;
    }

    getFee(op_type, options) {
        let op_code = operations[op_type];

        let currentFees = this.globalObject.parameters.current_fees.parameters[op_code][1];

        let fee = 0;
        if (currentFees.fee) {
            fee += currentFees.fee;
        }

        if (options) {
            for (let option of options) {
                fee += currentFees[option];
            }
        }

        return fee;
    }

    onGetBlock(block) {
        if (!this.blocks.get(block.id)) {
            block.timestamp = new Date(block.timestamp);
            this.blocks = this.blocks.set(
                block.id,
                Block(block)
            );
        }
    }

    onGetLatest(payload) {
        let {block, maxBlock} = payload;
        block.timestamp = new Date(block.timestamp);
        if (block.id > maxBlock - this.maxBlocks) {
            this.latestBlocks = this.latestBlocks.unshift(Block(block));
            if (this.latestBlocks.size > this.maxBlocks) {
                this.latestBlocks = this.latestBlocks.pop();
            }
            

            if (block.transactions.length > 0) {
                block.transactions.forEach(trx => {
                    trx.block_num = block.id;
                    this.latestTransactions = this.latestTransactions.unshift(trx);
                })
            }

            if (this.latestTransactions.size > this.maxBlocks) {
                this.latestTransactions = this.latestTransactions.pop();
            }
        }

    }

    onGetGlobals(objectArray) {
        objectArray.forEach(object => {
            if (object.id === "2.0.0") {
                this.globalObject = GlobalObject(object);
            } else if (object.id === "2.1.0") {
                object.time = new Date(object.time);
                object.next_maintenance_time = new Date(object.next_maintenance_time);
                this.dynGlobalObject = DynGlobalObject(object);
            }
        });
    }

    onUpdateRpcConnectionStatus(status){
        if(status === "reconnect")  ChainStore.resetCache();
        else this.rpc_connection_status = status;
    }

}

module.exports = alt.createStore(BlockchainStore, "BlockchainStore");
