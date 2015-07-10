import alt from "../alt-instance";
import WalletApi from "rpc_api/WalletApi";

let wallet_api = new WalletApi();

class VoteActions {

    addItem(container_name, account_name, item) {
        this.dispatch({container_name, account_name, item});
    }

    removeItem(container_name, account_name, item) {
        this.dispatch({container_name, account_name, item});
    }

    setProxyAccount(account_name, proxy_account) {
        console.log("[VoteActions.js:18] ----- setProxyAccount ----->", account_name, proxy_account);
        this.dispatch({
            account: account_name,
            proxy: proxy_account
        });
    }

    publishChanges(account_name, account_json) {
        var tr = wallet_api.new_transaction();
        tr.add_type_operation("account_update", account_json);
        return wallet_api.sign_and_broadcast(tr).then( result => {
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
