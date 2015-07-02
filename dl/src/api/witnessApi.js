import Apis from "rpc_api/ApiInstances";

class Api {

    lookupWitnesses(start_symbol, limit) {
        return Apis.instance().db_api().exec("lookup_witness_accounts", [
            start_symbol, limit]);
    }

    getWitnessByAccount(id) {
        return Apis.instance().db_api().exec("get_witness_by_account", [
            id
        ]);
    }

    getWitnesses(ids) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        return Apis.instance().db_api().exec("get_witnesses", [
            ids
        ]);
    }

    lookupDelegates(start_symbol, limit) {
        return Apis.instance().db_api().exec("lookup_delegate_accounts", [
            start_symbol, limit]);
    }

    getDelegateByAccount(id) {
        return Apis.instance().db_api().exec("get_delegate_by_account", [
            id
        ]);
    }

    getDelegates(ids) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        return Apis.instance().db_api().exec("get_delegates", [
            ids
        ]);
    }
}

export default new Api();
