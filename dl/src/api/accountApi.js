import { Apis, chain_types } from "@graphene/chain";

let {object_type} = chain_types;
let op_history = parseInt(object_type.operation_history, 10);

class Api {

    lookupAccounts(startChar, limit) {
        return Apis.instance().db_api().exec("lookup_accounts", [
            startChar, limit
        ]);
    }
}

export default new Api();
