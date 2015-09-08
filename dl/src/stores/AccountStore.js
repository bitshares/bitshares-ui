import BaseStore from "./BaseStore";
import Immutable from "immutable";
import alt from "../alt-instance";
import AccountActions from "../actions/AccountActions";
import {
    Account
}
from "./tcomb_structs";
import iDB from "../idb-instance";
import PrivateKeyStore from "./PrivateKeyStore";
import validation from "common/validation"

/**
 *  This Store holds information about accounts in this wallet
 *
 */
class AccountStore extends BaseStore {
    constructor() {
        super();
        this.currentAccount = null;
        this.linkedAccounts = Immutable.Set();
        this.payeeAccounts = Immutable.Set();
        this.searchAccounts = Immutable.Map();
        this.bindListeners({
            onSetCurrentAccount: AccountActions.setCurrentAccount,
            onCreateAccount: AccountActions.createAccount,
            onLinkAccount: AccountActions.linkAccount,
            onUnlinkAccount: AccountActions.unlinkAccount,
            onAccountSearch: AccountActions.accountSearch,
        });
        this._export("loadDbData", "tryToSetCurrentAccount", "onCreateAccount");
    }

    loadDbData() {
        this.linkedAccounts = Immutable.Set();
        return iDB.load_data("linked_accounts").then(data => {
            this.linkedAccounts = this.linkedAccounts.withMutations(set => {
                for (let a of data) {
                    set.add(a.name);
                }
            });
        });
    }

    onAccountSearch(accounts) {
        this.searchAccounts = this.searchAccounts.clear();
        accounts.forEach(account => {
            this.searchAccounts = this.searchAccounts.withMutations(map => {
                map.set(account[1], account[0]);
            });
        });
    }

    tryToSetCurrentAccount() {
        if (this.linkedAccounts.size > 0) {
            this.setCurrentAccount(this.linkedAccounts.first());
        }  
    }

    setCurrentAccount(name) {
        if (!name) {
            this.currentAccount = null;
        } else {
            this.currentAccount = name
        }
    }

    onSetCurrentAccount(name) {
        this.setCurrentAccount(name);
    }
    
    onCreateAccount(name_or_account) {
        var account = name_or_account;
        if (typeof account === "string") {
            account = {
                name: account
            };
        }
        
        if(account["toJS"])
            account = account.toJS()
        
        if(account.name == "" || this.linkedAccounts.get(account.name))
            return Promise.resolve()
        
        if( ! validation.is_account_name(account.name))
            throw new Error("Invalid account name: " + account.name)
        
        return iDB.add_to_store("linked_accounts", {name: account.name}).then(() => {
            console.log("[AccountStore.js] ----- Added account to store: ----->", account.name);
            this.linkedAccounts = this.linkedAccounts.add(account.name);
            if (this.linkedAccounts.size === 1) {
                this.setCurrentAccount(account.name);
            }
        });
    }

    onLinkAccount(name) {
        if( ! validation.is_account_name(name))
            throw new Error("Invalid account name: " + name)
        
        iDB.add_to_store("linked_accounts", {
            name
        });
        this.linkedAccounts = this.linkedAccounts.add(name);
        if (this.linkedAccounts.size === 1) {
            this.setCurrentAccount(name);
        }
    }

    onUnlinkAccount(name) {
        if( ! validation.is_account_name(name))
            throw new Error("Invalid account name: " + name)
        
        iDB.remove_from_store("linked_accounts", name);
        this.linkedAccounts = this.linkedAccounts.remove(name);
        if (this.linkedAccounts.size === 0) {
            this.setCurrentAccount(null);
        }
    }

}

module.exports = alt.createStore(AccountStore, "AccountStore");
