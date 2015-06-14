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
        this.bitasset_data = Immutable.Map();

        this.bindListeners({
            onGetAssetList: AssetActions.getAssetList,
            onGetAsset: AssetActions.getAsset
        });
    }

    onGetAssetList(payload) {
        payload.assets.forEach(asset => {

            for (var i = 0; i < payload.dynamic_data.length; i++) {
                if (payload.dynamic_data[i].id === asset.dynamic_asset_data_id) {
                    asset.dynamic_data = payload.dynamic_data[i];
                    break;
                }
            }

            if (asset.bitasset_data_id) {
                asset.market_asset = true;

                for (var i = 0; i < payload.bitasset_data.length; i++) {
                    if (payload.bitasset_data[i].id === asset.bitasset_data_id) {
                        asset.bitasset_data = payload.bitasset_data[i];
                        break;
                    }
                }
            } else {
                asset.market_asset = false;
            }

            this.assets = this.assets.set(
                asset.id,
                Asset(asset)
            );

            this.asset_symbol_to_id[asset.symbol] = asset.id;
        });

    }

    onGetAsset(payload) {
        let {
            asset
        } = payload;

        // console.log("onGetAsset payload:", payload);
        asset.dynamic_data = payload.dynamic_data;

        if (payload.bitasset_data) {
            asset.bitasset_data = payload.bitasset_data;
            asset.market_asset = true;
        } else {
            asset.market_asset = false;
        }

        this.assets = this.assets.set(
            asset.id,
            Asset(asset)
        );

        this.asset_symbol_to_id[asset.symbol] = asset.id;
    }
}

module.exports = alt.createStore(AssetStore, "AssetStore");
