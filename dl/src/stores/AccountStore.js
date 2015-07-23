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
        this.cachedAccounts = Immutable.Map();
        this.linkedAccounts = Immutable.Set();
        this.payeeAccounts = Immutable.Set();
        this.searchAccounts = Immutable.Map();
        this.balances = Immutable.Map();
        this.accountHistories = Immutable.Map();
        this.account_name_to_id = {};
        this.account_id_to_name = {};
        this.bindListeners({
            onGetAllAccounts: AccountActions.getAllAccounts,
            onGetAccount: AccountActions.getAccount,
            onSetCurrentAccount: AccountActions.setCurrentAccount,
            onTransfer: AccountActions.transfer,
            onCreateAccount: AccountActions.createAccount,
            onUpgradeAccount: AccountActions.upgradeAccount,
            onGetAccounts: AccountActions.getAccounts,
            onLinkAccount: AccountActions.linkAccount,
            onUnlinkAccount: AccountActions.unlinkAccount,
            onAccountSearch: AccountActions.accountSearch
        });
        this._export("loadDbData", "tryToSetCurrentAccount", "onCreateAccount");
    }

    loadDbData() {
        return iDB.load_data("linked_accounts").then( data => {
            this.linkedAccounts = this.linkedAccounts.withMutations(set => {
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
        });
    }

    onAccountSearch(accounts) {
        this.searchAccounts = this.searchAccounts.clear();
        accounts.forEach(account => {
            this.searchAccounts = this.searchAccounts.set(
                account[1],
                account[0]
            );
        });
    }

    onGetAllAccounts(accounts) {
        accounts.forEach(account => {
            this.account_id_to_name[account[1]] = account[0];
            this.account_name_to_id[account[0]] = account[1];
        });
    }

    onGetAccount(result) {
        if (result.sub) {
            this.accountHistories = this.accountHistories.set(
                result.account,
                result.history
            );
            let name = this.account_id_to_name[result.account];
            this.balances = this.balances.set(
                name,
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
                    account.name,
                    balances
                );

                this.account_name_to_id[account.name] = account.id;

                let newAccount = Account(account);

                this.cachedAccounts = this.cachedAccounts.set(
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

    tryToSetCurrentAccount() {
        if(this.linkedAccounts.size > 0) this.setCurrentAccount(this.linkedAccounts.first());
        else {
            let nathan_account = this.cachedAccounts.first();
            if(nathan_account && nathan_account.name === "nathan" && 
                nathan_account.owner.key_auths[0][0] === "GPH6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV"
            ) {
                this.setCurrentAccount("nathan");
            }
        }
    }

    setCurrentAccount(name) {
        if(!name) {
            this.currentAccount = null;
        } else {
            this.currentAccount = {
                name: name,
                id: this.account_name_to_id[name]
            };
        }
    }

    onSetCurrentAccount(name) {
        this.setCurrentAccount(name);
    }

    onTransfer(result) {
        console.log("[AccountStore.js] ----- onTransfer ----->", result);
    }

    onCreateAccount(name_or_account) {
        var account = name_or_account
        if(typeof account == "string")
            account = {name: account}
        
        iDB.add_to_store("linked_accounts", account).then( () => {
            console.log("[AccountStore.js] ----- Added account to store: ----->", name);
            this.linkedAccounts = this.linkedAccounts.add(account.name);
            if(this.linkedAccounts.size === 1) this.setCurrentAccount(account.name);
        });
    }

    onUpgradeAccount(account_id) {
        console.log("[AccountStore.js] ----- onUpgradeAccount ----->", account_id);
    }

    onLinkAccount(name) {
        iDB.add_to_store("linked_accounts", {name});
        this.linkedAccounts = this.linkedAccounts.add(name);
        if(this.linkedAccounts.size === 1) this.setCurrentAccount(name);
    }

    onUnlinkAccount(name) {
        iDB.remove_from_store("linked_accounts", name);
        this.linkedAccounts = this.linkedAccounts.remove(name);
        if(this.linkedAccounts.size === 0) this.setCurrentAccount(null);
    }

    onTransactUpdateAccount(account) {
        console.log("[AccountStore.js:154] ----- onTransactUpdateAccount ----->", account);
    }

}

module.exports = alt.createStore(AccountStore, "AccountStore");
