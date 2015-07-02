import BaseStore from "./BaseStore";
import Immutable from "immutable";
import alt from "../alt-instance";
import AccountActions from "../actions/AccountActions";
import {Account} from "./tcomb_structs";
import iDB from "../idb-instance";

class AccountStore extends BaseStore {
    constructor() {
        super();
        this.currentAccount = null;
        this.browseAccounts = Immutable.Map();
        this.accounts = Immutable.Map();
        this.balances = Immutable.Map();
        this.accountHistories = Immutable.Map();
        this.account_name_to_id = {};
        this.account_id_to_name = {};
        this.my_accounts = Immutable.Set();
        this.bindListeners({
            onGetAllAccounts: AccountActions.getAllAccounts,
            onGetAccount: AccountActions.getAccount,
            onSetCurrentAccount: AccountActions.setCurrentAccount,
            onTransfer: AccountActions.transfer,
            onCreateAccount: AccountActions.createAccount,
            onUpgradeAccount: AccountActions.upgradeAccount,
            onGetAccounts: AccountActions.getAccounts
        });
        this._export("loadDbData");
    }

    loadDbData() {
        iDB.load_data("my_accounts").then( data => {
            this.my_accounts = this.my_accounts.withMutations(set => {
                for(let a of data) {
                    set.add(a.name);
                }
            });
        });
    }

    onGetAccounts(accounts) {
        accounts.forEach(account => {
            this.account_id_to_name[account[1]] = account[0];
            this.account_name_to_id[account[0]] = account[1];
            if (account[0] === "nathan") {
                this.currentAccount = {
                    name: account[0],
                    id: account[1]
                };
            }
        });
    }

    onGetAllAccounts(accounts) {
        accounts.forEach(account => {
            this.account_id_to_name[account[1]] = account[0];
            this.account_name_to_id[account[0]] = account[1];
            if (account[0] === "nathan") {
                this.currentAccount = {
                    name: account[0],
                    id: account[1]
                };
            }
        });
    }

    onGetAccount(result) {
        if (result.sub) {
            this.accountHistories = this.accountHistories.set(
                result.account,
                result.history
            );

            this.balances = this.balances.set(
                result.account,
                result.balances
            );
        } else {
            let account = result[0][0];

            if (account.id) {
                let balances = result[1].length > 0 ? result[1] : [{
                    amount: 0,
                    asset_id: "1.3.0"
                }];

                this.balances = this.balances.set(
                    account.id,
                    balances
                );

                this.account_name_to_id[account.name] = account.id;

                let newAccount = Account(account);

                this.browseAccounts = this.browseAccounts.set(
                    account.id,
                    newAccount
                );

                this.accounts = this.accounts.set(
                    account.id,
                    newAccount
                );

                this.accountHistories = this.accountHistories.set(
                    account.id,
                    result[2]
                );
            }
        }
    }

    getCurrent() {
        this.getAccount(this.currentAccount.name);
    }

    onSetCurrentAccount(name) {
        this.currentAccount = {
            name: name,
            id: this.account_name_to_id[name]
        };
    }

    onTransfer(result) {
        console.log("[AccountStore.js] ----- onTransfer ----->", result);
    }

    onCreateAccount(name) {
        iDB.add_to_store("my_accounts", {name}).then( (name) => {
            console.log("[AccountStore.js] ----- Added account to store: ----->", name);
            this.my_accounts = this.my_accounts.add(name);
        });
    }

    onUpgradeAccount(account_id) {
        console.log("[AccountStore.js] ----- onUpgradeAccount ----->", account_id);
    }

}

module.exports = alt.createStore(AccountStore, "AccountStore");
