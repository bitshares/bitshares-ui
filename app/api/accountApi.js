import {Apis} from "bitsharesjs-ws";

class Api {
    lookupAccounts(startChar, limit) {
        return Apis.instance()
            .db_api()
            .exec("lookup_accounts", [startChar, limit]);
    }
    lookupAccountByPublicKey(pubKey) {
        return Apis.instance()
            .db_api()
            .exec("get_key_references", [[pubKey]]);
    }
}

export default new Api();
