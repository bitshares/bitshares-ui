var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";
import utils from "common/utils";

let inProgress = {};

class AssetActions {

    createAsset(assetObject) {
        // Create asset action here...
    }

    getAssetList(start, count) {
        // console.log("get assetlist:", start, count);
        let id = start + "_" + count;
        if (!inProgress[id]) {
            Apis.instance().db_api().exec("list_assets", [
                    start, count
                ]).then(assets => {
                    let bitAssetIDS = [];
                    let bitasset_to_asset = {};
                    assets.forEach(asset => {
                        if (asset.bitasset_data_id) {
                            bitAssetIDS.push(asset.bitasset_data_id);
                            bitasset_to_asset[asset.bitasset_data_id] = asset.id;
                        }
                    });

                    let bitAssetPromise = bitAssetIDS.length > 0 ? Apis.instance().db_api().exec("get_objects", [
                        bitAssetIDS
                    ]) : null;

                    if (!bitAssetPromise) {
                        this.dispatch({
                            assets: assets
                        });
                    } else {
                        bitAssetPromise.then(bitasset_data => {
                            this.dispatch({
                                assets: assets,
                                bitasset_data: bitasset_data,
                                bitasset_to_asset: bitasset_to_asset
                            });
                        });
                    }
                    delete inProgress[id];
                })
                .catch(error => {
                    console.log("Error in AssetStore.getAssetList: ", error);
                    delete inProgress[id];
                });
        }
    }

    getAsset(id) {
        let assetPromise;
        if (!inProgress[id]) {
            inProgress[id] = true;
            if (utils.is_object_id(id)) {
                assetPromise = Apis.instance().db_api().exec("get_objects", [
                    [id]
                ]);
            } else {
                assetPromise = Apis.instance().db_api().exec("list_assets", [
                    id, 1
                ]);
            }

            return assetPromise.then((asset) => {
                if (asset[0].bitasset_data_id) {
                    Apis.instance().db_api().exec("get_objects", [
                        [asset[0].bitasset_data_id]
                    ]).then(bitasset_data => {
                        this.dispatch({
                            asset: asset[0],
                            bitasset_data: bitasset_data[0]
                        });
                        delete inProgress[id];
                    });
                } else {
                    this.dispatch({
                        asset: asset[0]
                    });
                    delete inProgress[id];
                }

            }).catch((error) => {
                console.log("Error in AssetStore.updateAsset: ", error);
                delete inProgress[id];
            });
        }
    }
}

module.exports = alt.createActions(AssetActions);
