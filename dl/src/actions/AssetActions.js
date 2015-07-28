var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";
import utils from "common/utils";
import WalletApi from "../rpc_api/WalletApi";
let wallet_api = new WalletApi();

let inProgress = {};

class AssetActions {

    createAsset(assetObject) {
        // Create asset action here...
        console.log("create asset:", assetObject);
        var tr = wallet_api.new_transaction();
        tr.add_type_operation("asset_create", assetObject);
        return wallet_api.sign_and_broadcast(tr).then(result => {
            console.log("asset create result:", result);
            // this.dispatch(account_id);
            return true;
        }).catch(error => {
            console.log("[AssetActions.js:150] ----- createAsset error ----->", error);
            return false;
        });
    }

    getAssetList(start, count) {
        let id = start + "_" + count;
        if (!inProgress[id]) {
            inProgress[id] = true;
            Apis.instance().db_api().exec("list_assets", [
                    start, count
                ]).then(assets => {
                    let bitAssetIDS = [];
                    let dynamicIDS = [];

                    assets.forEach(asset => {
                        dynamicIDS.push(asset.dynamic_asset_data_id);

                        if (asset.bitasset_data_id) {
                            bitAssetIDS.push(asset.bitasset_data_id);
                        }
                    });

                    let dynamicPromise = Apis.instance().db_api().exec("get_objects", [
                        dynamicIDS
                    ]);

                    let bitAssetPromise = bitAssetIDS.length > 0 ? Apis.instance().db_api().exec("get_objects", [
                        bitAssetIDS
                    ]) : null;

                    Promise.all([
                            dynamicPromise,
                            bitAssetPromise
                        ])
                        .then(results => {
                            this.dispatch({
                                assets: assets,
                                dynamic_data: results[0],
                                bitasset_data: results[1]
                            });
                            delete inProgress[id];

                        });
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
                let bitAssetPromise = asset[0].bitasset_data_id ? Apis.instance().db_api().exec("get_objects", [
                    [asset[0].bitasset_data_id]
                ]) : null;

                Promise.all([
                        Apis.instance().db_api().exec("get_objects", [
                            [asset[0].dynamic_asset_data_id]
                        ]),
                        bitAssetPromise
                    ])
                    .then(results => {
                        this.dispatch({
                            asset: asset[0],
                            dynamic_data: results[0][0],
                            bitasset_data: results[1] ? results[1][0] : null
                        });
                        delete inProgress[id];
                    });

            }).catch((error) => {
                console.log("Error in AssetStore.updateAsset: ", error);
                delete inProgress[id];
            });
        }
    }
}

module.exports = alt.createActions(AssetActions);