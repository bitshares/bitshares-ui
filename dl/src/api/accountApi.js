import Apis from "../rpc_api/ApiInstances";
import {object_type} from "../chain/chain_types";
var PrivateKey = require("../ecc/key_private");

let op_history = parseInt(object_type.operation_history, 10);

class Api {

    lookupAccounts(startChar, limit) {
        return Apis.instance().db_api().exec("lookup_accounts", [
            startChar, limit
        ]);
    }
}

export default new Api();
