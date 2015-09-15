import BaseStore from "./BaseStore";
import Immutable from "immutable";
import alt from "../alt-instance";
import AccountActions from "../actions/AccountActions";
import {
    Account
}
from "./tcomb_structs";
import iDB from "../idb-instance";
import PrivateKeyStore from "./PrivateKeyStore"
import PrivateKeyActions from "actions/PrivateKeyActions"
import validation from "common/validation"
import ChainStore from "api/ChainStore"

/**
 *  This Store holds information about accounts in this wallet
 *
 */
class AccountStore extends BaseStore {
    constructor() {
        super();
        this.clearCache()
        //ChainStore.subscribe(this.chainStoreUpdate_accountsByKey.bind(this))
        this.bindListeners({
            onSetCurrentAccount: AccountActions.setCurrentAccount,
            onCreateAccount: AccountActions.createAccount,
            onLinkAccount: AccountActions.linkAccount,
            onUnlinkAccount: AccountActions.unlinkAccount,
            onAccountSearch: AccountActions.accountSearch,
            // onNewPrivateKeys: [ PrivateKeyActions.loadDbData, PrivateKeyActions.addKey ]
        });
        this._export("loadDbData", "tryToSetCurrentAccount", "onCreateAccount");
    }
    
    clearCache() {
        this.currentAccount = null;
        this.linkedAccounts = Immutable.Set();
        this.searchAccounts = Immutable.Map();
        // this.refAccounts = Immutable.Map()
    }
    
    /**
        @todo "partial"
        @return string "none", "full", "partial"
    */
    getMyAuthorityForAccount(account) {
        if(account === undefined) return undefined
        if( ! account) return null
        let my_authority = "none";
        if (account) {
            for (let k of account.owner.key_auths) {
                if (this.hasKey(k[0])) {
                    my_authority = "full";
                    break;
                }
            }
            for (let k of account.active.key_auths) {
                if (this.hasKey(k[0])) {
                    my_authority = "full";
                    break;
                }
            }
        }
        return my_authority;
    }
    
    // getRefAccountNames(full_auth = true) {
    //     var names = []
    //     for(let account of this.state.refAccounts) {
    //         if(!full_auth || this.getMyAuthorityForAccount(account) === "full")
    //             names.push(account.name)
    //     }
    //     return names
    // }
    
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
    
    // onNewPrivateKeys() {
    //     this.setState({accountsByKeyLoading: true})
    //     PrivateKeyStore.getState().keys.forEach( key => {
    //         ChainStore.getAccountRefsOfKey(key.pubkey)
    //     })
    // }
    
    // TODO move to worker thread
    // chainStoreUpdate_accountsByKey() {
    //     if(this.previous_account_ids_by_key === ChainStore.account_ids_by_key ||
    //         this.previous_objects_by_id === ChainStore.objects_by_id)
    //         return
    //     
    //     this.setState({accountsByKeyLoading: false})
    //     this.previous_account_ids_by_key = ChainStore.account_ids_by_key
    //     this.previous_objects_by_id = ChainStore.objects_by_id
    //     var refAccounts = this.state.refAccounts
    //     PrivateKeyStore.getState().keys.forEach( key => {
    //         if(ChainStore.getAccountRefsOfKey(key.pubkey) === undefined)
    //             this.setState({accountsByKeyLoading: true})
    //     })
    //     for(let acccount_id_set of ChainStore.account_ids_by_key.values()) {
    //         acccount_id_set.forEach( account_id => {
    //             var account = ChainStore.getAccount(account_id)
    //             if(account === undefined)
    //                 this.setState({accountsByKeyLoading: true})
    //             if( ! account) return
    //             if( refAccounts.has(account.name)) return
    //             refAccounts = refAccounts.set(account.name, account)
    //             this.setState({refAccounts})
    //         })
    //     }
    // }

}

module.exports = alt.createStore(AccountStore, "AccountStore");
