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
        ChainStore.subscribe(this.chainStoreUpdate.bind(this))
        this.bindListeners({
            onSetCurrentAccount: AccountActions.setCurrentAccount,
            onCreateAccount: AccountActions.createAccount,
            onLinkAccount: AccountActions.linkAccount,
            onUnlinkAccount: AccountActions.unlinkAccount,
            onAccountSearch: AccountActions.accountSearch,
            // onNewPrivateKeys: [ PrivateKeyActions.loadDbData, PrivateKeyActions.addKey ]
        });
        this._export("loadDbData", "tryToSetCurrentAccount", "onCreateAccount", "getMyAccounts");
    }
    
    clearCache() {
        this.state = { update: false }
        this.state.currentAccount = null;
        this.state.linkedAccounts = Immutable.Set();
        this.state.searchAccounts = Immutable.Map();
        // this.refAccounts = Immutable.Map()
    }
    
    chainStoreUpdate() {
        if(this.state.update) {
            // console.log("Account chainStoreUpdate, notify listners");
            this.setState({update: false})
        }
    }
    
    getMyAccounts() {
        var accounts = []
        for(let account_name of this.state.linkedAccounts) {
            var account = ChainStore.getAccount(account_name)
            if(account === undefined) {
                this.state.update = true
                continue
            }
            if(account == null) {
                console.log("... ChainStore.getAccount("+account_name+") == null")
                continue
            }
            if(this.getMyAuthorityForAccount(account) === "full") {
                accounts.push(account_name)
            }
        }
        return accounts
    }
    
    /**
        @todo "partial"
        @return string "none", "full", "partial"
    */
    getMyAuthorityForAccount(account) {
        if (! account) return undefined
        // @return 3 full, 2 partial, 0 none
        function pubkeyThreshold(authority) {
            var available = 0
            var required = authority.get("weight_threshold")
            for (let k of authority.get("key_auths")) {
                if (PrivateKeyStore.hasKey(k.get(0))) {
                    available += k.get(1)
                }
                if(available >= required) break
            }
            return available >= required ? 3 : available > 0 ? 2 : 0
        }
        var owner = pubkeyThreshold(account.get("owner"))
        if(owner == 3) return "full"
        
        var active = pubkeyThreshold(account.get("active"))
        if(active == 3) return "full"
        
        if(owner == 2 || active == 2) return "partial"
        
        return "none"
    }
    
    onAccountSearch(accounts) {
        this.state.searchAccounts = this.state.searchAccounts.clear();
        accounts.forEach(account => {
            this.state.searchAccounts = this.state.searchAccounts.withMutations(map => {
                map.set(account[1], account[0]);
            });
        });
    }

    tryToSetCurrentAccount() {
        if (this.state.linkedAccounts.size > 0) {
            this.state.setCurrentAccount(this.state.linkedAccounts.first());
        }  
    }

    setCurrentAccount(name) {
        if (!name) {
            this.state.currentAccount = null;
        } else {
            this.state.currentAccount = name
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
        
        if(account.name == "" || this.state.linkedAccounts.get(account.name))
            return Promise.resolve()
        
        if( ! validation.is_account_name(account.name))
            throw new Error("Invalid account name: " + account.name)
        
        return iDB.add_to_store("linked_accounts", {name: account.name}).then(() => {
            console.log("[AccountStore.js] ----- Added account to store: ----->", account.name);
            this.state.linkedAccounts = this.state.linkedAccounts.add(account.name);
            if (this.state.linkedAccounts.size === 1) {
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
        this.state.linkedAccounts = this.state.linkedAccounts.add(name);
        if (this.state.linkedAccounts.size === 1) {
            this.setCurrentAccount(name);
        }
    }

    onUnlinkAccount(name) {
        if( ! validation.is_account_name(name))
            throw new Error("Invalid account name: " + name)
        
        iDB.remove_from_store("linked_accounts", name);
        this.state.linkedAccounts = this.state.linkedAccounts.delete(name);
        if (this.state.linkedAccounts.size === 0) {
            this.setCurrentAccount(null);
        }
    }
    
    loadDbData() {
        this.state.linkedAccounts = Immutable.Set();
        return iDB.load_data("linked_accounts").then(data => {
            this.state.linkedAccounts = this.state.linkedAccounts.withMutations(set => {
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
