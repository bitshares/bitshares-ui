import alt from "../alt-instance";
import WalletApi from "rpc_api/WalletApi";
import {cloneDeep} from "lodash"
import WalletDb from "../stores/WalletDb";

let wallet_api = new WalletApi();

class VoteActions {

    addItem(container_name, account_name, item) {
        this.dispatch({container_name, account_name, item});
    }

    removeItem(container_name, account_name, item) {
        this.dispatch({container_name, account_name, item});
    }

    setProxyAccount(account_name, proxy_account_id, proxy_account_name) {
        this.dispatch({account_name, proxy_account_id, proxy_account_name});
    }

    publishChanges(account_name, account_json) {
        let _account_json = cloneDeep(account_json);
        _account_json.account = account_json.id;
        delete _account_json.id;
        delete _account_json.options;
        console.log("[VoteActions.js:28] ----- publishChanges ----->", _account_json);
        var tr = wallet_api.new_transaction();
        tr.add_type_operation("account_update", _account_json);
        return WalletDb.process_transaction(tr, null, true).then(result => {
            this.dispatch(account_name);
        }).catch(error => {
            console.log("[VoteActions.js] ----- publishChanges error ----->", error);
        });
    }

    cancelChanges(account_name) {
        this.dispatch(account_name);
    }

}

module.exports = alt.createActions(VoteActions);
