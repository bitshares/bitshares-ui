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

    unSubscribeAccounts(names_or_ids) {
        if (!Array.isArray(names_or_ids)) {
            names_or_ids = [names_or_ids];
        }
        return Apis.instance().db_api().exec("unsubscribe_from_accounts", [
            names_or_ids
        ]);
    }

    createAccount(name) {
        return Apis.instance().app_api().create_account_with_brain_key(
            PrivateKey.fromSeed("owner").toPublicKey().toPublicKeyString(),
            PrivateKey.fromSeed("active").toPublicKey().toPublicKeyString(), 
            name, 11, 0, 0, true //broadcast
        );
    }

    getFullAccounts(cb, names_or_ids, sub) {
        if (!Array.isArray(names_or_ids)) {
            names_or_ids = [names_or_ids];
        }
        let args = [
            cb == null ? function(){} : cb, names_or_ids, sub
        ];
        // console.log( "get_full_accounts: ", args );
        return Apis.instance().db_api().exec("get_full_accounts", args);
    }
}

export default new Api();
