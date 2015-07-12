import alt from "../alt-instance";
import utils from "../common/utils";
import api from "../api/accountApi";

import WalletApi from "../rpc_api/WalletApi";
import WalletDb from "../stores/WalletDb";
import WalletActions from "../actions/WalletActions"

let accountSubs = {};
let accountLookup = {};
let accountSearch = {};
let wallet_api = new WalletApi();

class AccountActions {

    accountSearch(start_symbol) {
        let uid = `${start_symbol}_50`;
            if (!accountSearch[uid]) {
                accountSearch[uid] = true;
            return api.lookupAccounts(start_symbol, 50)
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

            if (utils.is_object_id(start_symbol) && limit===1) {
                return api.getObjects(start_symbol).then(result => {
                    this.dispatch([[result[0].name, result[0].id]]);
                })
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
        api.unSubscribeAccount(accountSubs[id]).then(unSubResult => {
            if (unSubResult) {
                console.log("unSubscribe from:", id);
                delete accountSubs[id];
            }
        });
    }

    getAccount(name_or_id, sub) {
        let subscription = (result) => {
            console.log("sub result:", result);
            let accountId = null;
            for (let id in accountSubs) {
                if (accountSubs[id] === result[0].id) {
                    accountId = id;
                    break;
                }
            }
            if (accountId) {
                Promise.all([
                    api.getHistory(accountId, 100),
                    api.getBalances(accountId)
                    ])
                .then(results => {
                    this.dispatch({
                        sub: true,
                        history: results[0],
                        balances: results[1],
                        account: accountId
                    });
                });
            }

        };

        if (utils.is_object_id(name_or_id)) {
            return Promise.all([
                    api.getObjects(name_or_id),
                    api.getBalances(name_or_id),
                    api.getHistory(name_or_id, 10)
                ])
                .then(result => {
                    if (!accountSubs[name_or_id] && sub) {
                        let statObject = result[0][0].statistics;
                        api.subscribeAccount(subscription, statObject)
                            .then(subResult => {
                                if (subResult) {
                                    accountSubs[name_or_id] = statObject;
                                    console.log("subscribed to account", name_or_id, ":", subResult);
                                }
                            });
                    }
                    this.dispatch(result);
                }).catch((error) => {
                    console.log("Error in AccountActions.getAccount: ", error);
                });
        } else {
            return api.lookupAccounts(name_or_id, 1)
                .then((account) => {
                    let id = account[0][1];
                    return Promise.all([
                        api.getObjects(id),
                        api.getBalances(id),
                        api.getHistory(id, 100)
                    ]).then((results) => {
                        if (!accountSubs[name_or_id] && sub) {
                            let statObject = results[0][0].statistics;
                            api.subscribeAccount(subscription, statObject)
                                .then(subResult => {
                                    if (subResult) {
                                        accountSubs[id] = statObject;
                                        console.log("subscribed to account", id, ":", subResult);
                                    }
                                });
                        }
                        this.dispatch(results);
                    }).catch((error) => {
                        console.log("Error in AccountActions.getAccount: ", error);
                    });
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

    createAccount( account_name ) {
        return WalletActions.createBrainKeyAccount(
            account_name
        ).then( () => {
            this.dispatch(account_name)
            return account_name
        })
    }

    upgradeAccount(account_id) {
        var tr = wallet_api.new_transaction();
        tr.add_type_operation("account_upgrade", { "account_to_upgrade": account_id, "upgrade_to_lifetime_member": true });
        return wallet_api.sign_and_broadcast(tr).then( result => {
            this.dispatch(account_id);
        }).catch(error => {
            console.log("[AccountActions.js:150] ----- upgradeAccount error ----->", error);
        });
    }

    linkAccount(name) {
        this.dispatch(name);
    }

    unlinkAccount(name) {
        this.dispatch(name);
    }

}
var _console_log = (result)=>{console.log(result)}

module.exports = alt.createActions(AccountActions);
