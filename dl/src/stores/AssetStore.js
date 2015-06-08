var BaseStore = require("./BaseStore");
var Immutable = require("immutable");
var alt = require("../alt-instance");
var AssetActions = require("../actions/AssetActions");
import {Asset} from "./tcomb_structs";

class AssetStore extends BaseStore {
    constructor() {
        super();
        this.assets = Immutable.Map();
        this.asset_symbol_to_id = {};

        this.bindListeners({
            onCreateAsset: AssetActions.createAsset,
            onGetAsset: AssetActions.getAsset
        });
    }

    onCreateAsset() {
        // Handle asset creation
    }

    onGetAsset(asset) {
        this.assets = this.assets.set(
            asset.id,
            Asset(asset)
        );
        this.asset_symbol_to_id[asset.symbol] = asset.id;
    }
}

module.exports = alt.createStore(AssetStore, "AssetStore");
