import alt from "../alt-instance";
import utils from "../common/utils";
import api from "../api/accountApi";

import WalletApi from "../rpc_api/WalletApi";
import WalletDb from "../stores/WalletDb";
import WalletActions from "../actions/WalletActions";

let accountSubs = {};
let accountLookup = {};
let accountSearch = {};
let wallet_api = new WalletApi();
let inProgress = {};

class AccountActions {

    accountSearch(start_symbol, limit = 50) {
        let uid = `${start_symbol}_${limit}}`;
        if (!accountSearch[uid]) {
            accountSearch[uid] = true;
            return api.lookupAccounts(start_symbol, limit)
                .then(result => {
                    accountSearch[uid] = false;
                    this.dispatch(result);
                });
        }
    }

    getAccounts(start_symbol, limit) {
        let uid = `${start_symbol}_${limit}`;
        if (!accountLookup[uid]) {
            accountLookup[uid] = true;

            if (utils.is_object_id(start_symbol) && limit === 1) {
                return api.getObjects(start_symbol).then(result => {
                    this.dispatch([
                        [result[0].name, result[0].id]
                    ]);
                });
            }

            return api.lookupAccounts(start_symbol, limit)
                .then(result => {
                    accountLookup[uid] = false;
                    this.dispatch(result);
                });
        }
    }

    getAllAccounts() {
        return api.lookupAccounts("", 1000).then(result => {
            this.dispatch(result);
        }).catch(error => {
            console.log("Error in AccountActions.getAllAccounts: ", error);
        });
    }

    unSubscribe(id) {
        api.unSubscribeAccounts(id).then(unSubResult => {
            console.log("unsub from", id, "result:", unSubResult);
            delete accountSubs[id];
        })
        .catch(err => {
            console.log("unsub error:", err);
        });
    }

    getAccount(name_or_id) {
        console.log("getAccount:", name_or_id);
        let subscription = (account, result) => {
            // console.log("sub result:", result, name_or_id);

            api.getFullAccounts(null, name_or_id)
                .then(fullAccount => {
                    api.getHistory(fullAccount[0][1].account.id, 100).then(history => {

                        this.dispatch({
                            sub: true,
                            fullAccount: fullAccount[0][1],
                            history: history
                        });
                    });
                });
        };

        if (!inProgress[name_or_id]) {
            inProgress[name_or_id] = true;

            return api.getFullAccounts(subscription.bind(this, name_or_id), name_or_id)
                .then(fullAccount => {
                    console.log("fullAccount:", fullAccount);
                    if (fullAccount.length === 0) {
                        return this.dispatch({
                            fullAccount: null,
                            history: [],
                            name: name_or_id
                        });
                    }
                    api.getHistory(fullAccount[0][1].account.id, 100).then(history => {

                        this.dispatch({
                            fullAccount: fullAccount[0][1],
                            history: history
                        });

                        delete inProgress[name_or_id];
                    });
                }).catch((error) => {
                    console.log("Error in AccountActions.getAccount: ", error);
                    delete inProgress[name_or_id];
                });
        }
    }

    setCurrentAccount(name) {
        this.dispatch(name);
    }

    transfer(from_account_name_or_id, to_account_name_or_id, amount, asset_name_or_id, memo) {
        //console.log("[AccountActions.js:68] ----- transfer ----->", from_account_name_or_id, to_account_name_or_id, amount, asset_name_or_id, memo);
        var from_account_id = from_account_name_or_id;
        var to_account_id = to_account_name_or_id;
        var asset_id = asset_name_or_id;
        let promise;

        try {
            promise = wallet_api.transfer(
                from_account_id, to_account_id,
                amount, asset_id, memo
            );
            promise.then(result => {
                this.dispatch(result);
            });
        } catch (error) {
            console.log("[AccountActions.js:90] ----- transfer error ----->", error);
            return new Promise((resolve, reject) => {
                reject(error);
            });
        }
        return promise;
    }

    createAccount(
        account_name,
        registrar,
        referrer,
        referrer_percent = 100
    ) {
        return WalletActions.createBrainKeyAccount(
            account_name,
            registrar,
            referrer,
            referrer_percent
        ).then( () => {
            this.dispatch(account_name)
            return account_name
        })
    }

    upgradeAccount(account_id) {
        var tr = wallet_api.new_transaction();
        tr.add_type_operation("account_upgrade", {
            "fee": {
                amount: 0,
                asset_id: 0
            },
            "account_to_upgrade": account_id,
            "upgrade_to_lifetime_member": true
        });
        return WalletDb.process_transaction(tr, null, true).then(result => {
            this.dispatch(account_id);
            return true;
        }).catch(error => {
            console.log("[AccountActions.js:150] ----- upgradeAccount error ----->", error);
            return false;
        });
    }

    linkAccount(name) {
        this.dispatch(name);
    }

    unlinkAccount(name) {
        this.dispatch(name);
    }

}

module.exports = alt.createActions(AccountActions);
