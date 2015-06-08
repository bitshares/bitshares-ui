var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";
import utils from "common/utils";

class AssetActions {

    createAsset(assetObject) {
        // Create asset action here...
    }

    getAsset(id) {
        let assetPromise;
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
        }).catch((error) => {
            console.log("Error in AssetStore.updateAsset: ", error);
        });
    }
}

module.exports = alt.createActions(AssetActions);
