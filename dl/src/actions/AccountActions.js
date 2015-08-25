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
        let account_id, account_name;
        let subscription = result => {
            // console.log("account sub result:", account_id, account_name, result, name_or_id);

            /* TODO: finish this parsing of the sub result once all necessary data is available
            let fullAccount = {}, 
                history_updates = null,
                balance_updates = null;

            for (let entry of result[0]) {

                let type = utils.get_op_type(entry.id);

                // Balance update
                if (entry.balance && entry.owner === account_id) {
                    if (!balance_updates) {
                        balance_updates = [];
                    }
                    balance_updates.push(entry);
                }

                // Order history update
                if (entry.block_num && entry.virtual_op) {
                    if (!history_updates) {
                        history_updates = [];
                    }
                    history_updates.push(entry);
                }

                // Account object update
                if (entry.id === account_id) {
                    fullAccount.account = entry;
                }

                if (type === "limit_order") {
                    console.log("limit order:", entry);
                    if (!fullAccount.limit_orders) {
                        fullAccount.limit_orders = [];
                    }
                    fullAccount.limit_orders.push(entry);
                }
            }

            this.dispatch({
                sub: true,
                fullAccount: fullAccount,
                balance_updates: balance_updates,
                history_updates: history_updates,
                id: account_id,
                account_name: account_name
            });

            */

            // Use brute force and refetch everything until the parsing is possible

            api.getFullAccounts(function(){}, name_or_id, true).then(fullAccount => {
                api.getHistory(fullAccount[0][1].account.id, 100).then(history => {
                    this.dispatch({
                        fullAccount: fullAccount[0][1],
                        history: history,
                        id: account_id,
                        account_name: account_name
                    });
                });
            });


        };

        if (!inProgress[name_or_id]) {
            inProgress[name_or_id] = true;

            return api.getFullAccounts(subscription, name_or_id, true)
                .then(fullAccount => {
                    if (fullAccount.length === 0) {
                        return this.dispatch({
                            fullAccount: null,
                            history: [],
                            name: name_or_id
                        });
                    }

                    //DEBUG console.log("AccountActions getAccount",fullAccount[0][1]);
                    account_id = fullAccount[0][1].account.id;
                    account_name = fullAccount[0][1].account.name;

                    api.getHistory(fullAccount[0][1].account.id, 100).then(history => {

                        this.dispatch({
                            fullAccount: fullAccount[0][1],
                            history: history,
                            id: account_id,
                            account_name: account_name
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

        try {
            return  wallet_api.transfer(
                from_account_id, to_account_id,
                amount, asset_id, memo
            ).then(result => {
                    console.log( "transfer result: ", result )
                    this.dispatch(result);
            });
        } catch (error) {
            console.log("[AccountActions.js:90] ----- transfer error ----->", error);
            return new Promise((resolve, reject) => {
                reject(error);
            });
        }
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
            this.dispatch(account_name);
            return account_name;
        });
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
        return WalletDb.process_transaction(tr, null, true);
    }

    linkAccount(name) {
        this.dispatch(name);
    }

    unlinkAccount(name) {
        this.dispatch(name);
    }
    
    change() {
        this.dispatch()
    }
    
}

module.exports = alt.createActions(AccountActions);
