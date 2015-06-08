var Immutable = require("immutable");
var alt = require("../alt-instance");
var BlockchainActions = require("../actions/BlockchainActions");
import {
    Block, GlobalObject, DynGlobalObject
}
from "./tcomb_structs";


class BlockchainStore {
    constructor() {
        // This might not need to be an immutable map, a normal structure might suffice..
        this.blocks = Immutable.Map();
        this.latestBlocks = Immutable.List();
        this.dynGlobalObject = {};
        this.globalObject = {};

        this.bindListeners({
            onGetBlock: BlockchainActions.getBlock,
            onGetGlobals: BlockchainActions.subscribeGlobals,
            onGetLatest: BlockchainActions.getLatest
        });
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

    onGetLatest(block) {
        block.timestamp = new Date(block.timestamp);
        if (block.id > this.dynGlobalObject.head_block_number - 10) {
            this.latestBlocks = this.latestBlocks.unshift(Block(block));
            if (this.latestBlocks.size > 10) {
                this.latestBlocks = this.latestBlocks.pop();
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

}

module.exports = alt.createStore(BlockchainStore, "BlockchainStore");