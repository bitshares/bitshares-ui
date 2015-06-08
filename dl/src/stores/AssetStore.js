var BaseStore = require("./BaseStore");
var Immutable = require("immutable");
var alt = require("../alt-instance");
var AssetActions = require("../actions/AssetActions");
import {
    Asset
}
from "./tcomb_structs";

class AssetStore extends BaseStore {
    constructor() {
        super();
        this.assets = Immutable.Map();
        this.asset_symbol_to_id = {};

        this.bindListeners({
            onGetAssetList: AssetActions.getAssetList,
            onGetAsset: AssetActions.getAsset
        });
    }

    onGetAssetList(assets) {
        assets.forEach(asset => {
            this.assets = this.assets.set(
                asset.id,
                Asset(asset)
            );
        });

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
