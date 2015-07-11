import Apis from "../rpc_api/ApiInstances";
import {object_type} from "../chain/chain_types";
var PrivateKey = require("../ecc/key_private");

let op_history = parseInt(object_type.operation_history, 10);

class Api {

    getObjects(ids) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        return Apis.instance().db_api().exec("get_objects", [ids]);
    }

    lookupAccounts(startChar, limit) {
        return Apis.instance().db_api().exec("lookup_accounts", [
            startChar, limit
        ]);
    }

    getBalances(id) {
        return Apis.instance().db_api().exec("get_account_balances", [id, []]);
    }

    getHistory(id, count) {
        return Apis.instance().history_api().exec("get_account_history", [id, "1." + op_history +".0", count, "1." + op_history + ".9999"]);
    }

    subscribeAccount(subscription, statID) {
        return Apis.instance().db_api().exec("subscribe_to_objects", [
            subscription, [statID]
        ]);
    }

    unSubscribeAccount(statID) {
        return Apis.instance().db_api().exec("unsubscribe_from_objects", [
            [statID]
        ]);
    }

    createAccount(name) {
        return Apis.instance().app_api().create_account_with_brain_key(
            PrivateKey.fromSeed("owner").toPublicKey().toBtsPublic(),
            PrivateKey.fromSeed("active").toPublicKey().toBtsPublic(), 
            name, 11, 0, 0, PrivateKey.fromSeed("nathan"), true
        );
    }
}

export default new Api();
