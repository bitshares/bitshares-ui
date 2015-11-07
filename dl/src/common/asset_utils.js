import assetConstants from "../chain/asset_constants";

export default class AssetUtils {
    
    static getFlagBooleans(mask) {
        let booleans = {
            charge_market_fee    : false,
            white_list           : false,
            override_authority   : false,
            transfer_restricted  : false,
            disable_force_settle : false,
            global_settle        : false,
            disable_confidential : false,
            witness_fed_asset    : false,
            committee_fed_asset  : false
        }

        for (let flag in booleans) {
            if (mask & assetConstants.permission_flags[flag]) {
                booleans[flag] = true;
            }
        }

        return booleans;
    }

    static getFlags(flagBooleans) {
        let keys = Object.keys(assetConstants.permission_flags);

        let flags = 0;

        keys.forEach(key => {
            if (flagBooleans[key] && key !== "global_settle") {
                flags += assetConstants.permission_flags[key];
            }
        })

        return flags;
    }

    static getPermissions(flagBooleans, isBitAsset) {
        let permissions = isBitAsset ? Object.keys(assetConstants.permission_flags) : assetConstants.uia_permission_mask;
        let flags = 0;
        permissions.forEach(permission => {
            if (flagBooleans[permission]) {
                flags += assetConstants.permission_flags[permission];
            }
        })

        return flags;
    }
}
