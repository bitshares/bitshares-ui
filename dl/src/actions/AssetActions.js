var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";
import utils from "common/utils";

let inProgress = {};

class AssetActions {

    createAsset(assetObject) {
        // Create asset action here...
    }

    getAssetList(start, count) {
        console.log("get assetlist:", start, count);
        let id = start + "_" + count;
        if (!inProgress[id]) {
            Apis.instance().db_api().exec("list_assets", [
                start, count
            ]).then(result => {
                this.dispatch(result);
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

            return assetPromise.then((result) => {
                this.dispatch(result[0]);
                delete inProgress[id];
            }).catch((error) => {
                console.log("Error in AssetStore.updateAsset: ", error);
                delete inProgress[id];
            });
        }
    }
}

module.exports = alt.createActions(AssetActions);
