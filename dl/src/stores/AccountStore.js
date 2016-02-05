import BaseStore from "./BaseStore";
import Immutable from "immutable";
import alt from "../alt-instance";
import AccountActions from "../actions/AccountActions";
import iDB from "../idb-instance";
import PrivateKeyStore from "./PrivateKeyStore"
import { validation } from "@graphene/chain"
import { ChainStore } from "@graphene/chain"
import AccountRefsStore from "stores/AccountRefsStore"
import AddressIndex from "stores/AddressIndex"
import SettingsStore from "stores/SettingsStore"
import ls from "common/localStorage";

let accountStorage = new ls("__graphene__")

/**
 *  This Store holds information about accounts in this wallet
 *
 */

class AccountStore extends BaseStore {
    constructor() {
        super();
        this.state = this._getInitialState()
        ChainStore.subscribe(this.chainStoreUpdate.bind(this))
        this.bindListeners({
            onSetCurrentAccount: AccountActions.setCurrentAccount,
            onCreateAccount: AccountActions.createAccount,
            onLinkAccount: AccountActions.linkAccount,
            onUnlinkAccount: AccountActions.unlinkAccount,
            onAccountSearch: AccountActions.accountSearch,
            onAddPrivateAccount: AccountActions.addPrivateAccount,
            onAddPrivateContact: AccountActions.addPrivateContact,
            onRemovePrivateContact: AccountActions.removePrivateContact
        });
        this._export("loadDbData", "tryToSetCurrentAccount", "onCreateAccount",
            "getMyAccounts", "isMyAccount", "getMyAuthorityForAccount", "getPrivateAccountType");
    }
    
    _getInitialState() {
        this.account_refs = null
        this.initial_account_refs_load = true // true until all undefined accounts are found

        return { 
            update: false,
            currentAccount: null,
            linkedAccounts: Immutable.Set(),
            myIgnoredAccounts: Immutable.Set(),
            unFollowedAccounts: Immutable.Set(accountStorage.get("unfollowed_accounts") || []),
            searchAccounts: Immutable.Map(),
            searchTerm: "",
            privateAccounts: Immutable.Set(),
            privateContacts: Immutable.Set()
        }
    }

    _addIgnoredAccount(name) {
        if (this.state.unFollowedAccounts.includes(name) && !this.state.myIgnoredAccounts.has(name)) {
            this.state.myIgnoredAccounts = this.state.myIgnoredAccounts.add(name);
        }
    }
    
    loadDbData() {
        var linkedAccounts = Immutable.Set().asMutable();
        
        iDB.load_data("linked_accounts")
        .then(data => {
            for (let a of data) {
                linkedAccounts.add(a.name);
                this._addIgnoredAccount(a.name);
            }

            this.setState({
                linkedAccounts: linkedAccounts.asImmutable()
            });
        })
    }
    
    chainStoreUpdate() {
        if(this.state.update) {
            this.setState({update: false})
        }
        this.addAccountRefs()
    }
    
    addAccountRefs() {
        //  Simply add them to the linkedAccounts list (no need to persist them)
        var account_refs = AccountRefsStore.getState().account_refs
        if( ! this.initial_account_refs_load && this.account_refs === account_refs) return
        this.account_refs = account_refs
        var pending = false
        this.state.linkedAccounts = this.state.linkedAccounts.withMutations(linkedAccounts => {
            account_refs.forEach(id => {
                var account = ChainStore.getAccount(id)
                if (account === undefined) {
                    pending = true
                    return
                }
                if (account && !this.state.unFollowedAccounts.includes(account.get("name"))) {
                    linkedAccounts.add(account.get("name"));
                } else {
                    this._addIgnoredAccount(account.get("name"));
                }
            })
        })
        // console.log("AccountStore addAccountRefs linkedAccounts",this.state.linkedAccounts.size);
        this.setState({ linkedAccounts: this.state.linkedAccounts })
        this.initial_account_refs_load = pending
        this.tryToSetCurrentAccount();
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
                console.log("WARN: non-chain account name in linkedAccounts", account_name)
                continue
            }
            var auth = this.getMyAuthorityForAccount(account)
            if(auth === undefined) {
                this.state.update = true
                continue
            } 
            if(auth === "full") {
                accounts.push(account_name)
            }
        }
        return accounts.sort()
    }
    
    /**
        @todo "partial"
        @return string "none", "full", "partial" or undefined (pending a chain store lookup)
    */
    getMyAuthorityForAccount(account, recursion_count = 1) {
        if (! account) return undefined
        
        var owner_authority = account.get("owner")
        var active_authority = account.get("active")
        
        var owner_pubkey_threshold = pubkeyThreshold(owner_authority)
        if(owner_pubkey_threshold == "full") return "full"
        var active_pubkey_threshold = pubkeyThreshold(active_authority)
        if(active_pubkey_threshold == "full") return "full"
        
        var owner_address_threshold = addressThreshold(owner_authority)
        if(owner_address_threshold == "full") return "full"
        var active_address_threshold = addressThreshold(active_authority)
        if(active_address_threshold == "full") return "full"
        
        var owner_account_threshold, active_account_threshold
        if(recursion_count < 3) {
            owner_account_threshold = this._accountThreshold(owner_authority, recursion_count)
            if ( owner_account_threshold === undefined ) return undefined
            if(owner_account_threshold == "full") return "full"
            active_account_threshold = this._accountThreshold(active_authority, recursion_count)
            if ( active_account_threshold === undefined ) return undefined
            if(active_account_threshold == "full") return "full"
        }
        if(
            owner_pubkey_threshold === "partial" || active_pubkey_threshold === "partial" ||
            owner_address_threshold === "partial" || owner_address_threshold === "partial" ||
            owner_account_threshold === "parital" || active_account_threshold === "partial"
        ) return "partial"
        return "none"
    }

    _accountThreshold(authority, recursion_count) {
        var account_auths = authority.get("account_auths")
        if( ! account_auths.size ) return "none"
        for (let a of account_auths)
            // get all accounts in the queue for fetching
            ChainStore.getAccount(a)
        
        for (let a of account_auths) {
            var account = ChainStore.getAccount(a)
            if(account === undefined) return undefined
            return this.getMyAuthorityForAccount(account, ++recursion_count)
        }
    }

    isMyAccount(account) {
        let authority = this.getMyAuthorityForAccount(account);
        if( authority === undefined ) return undefined
        return authority === "partial" || authority === "full";
    }
    
    onAccountSearch(payload) {
        this.state.searchTerm = payload.searchTerm;
        this.state.searchAccounts = this.state.searchAccounts.clear();
        payload.accounts.forEach(account => {
            this.state.searchAccounts = this.state.searchAccounts.withMutations(map => {
                map.set(account[1], account[0]);
            });
        });
    }

    tryToSetCurrentAccount() {
        if (localStorage.currentAccount) {
            return this.setCurrentAccount(localStorage.currentAccount);
        }

        let {starredAccounts} = SettingsStore.getState();
        if (starredAccounts.size) {
            return this.setCurrentAccount(starredAccounts.first().name);
        }
        if (this.state.linkedAccounts.size) {
            return this.setCurrentAccount(this.state.linkedAccounts.first());
        }  
    }

    setCurrentAccount(name) {
        if (!name) {
            this.state.currentAccount = null;
        } else {
            this.state.currentAccount = name
        }

        localStorage.currentAccount = this.state.currentAccount;
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
        if( ! validation.is_account_name(name, true))
            throw new Error("Invalid account name: " + name)
        
        // Link
        iDB.add_to_store("linked_accounts", {
            name
        });        
        this.state.linkedAccounts = this.state.linkedAccounts.add(name);

        // remove from unFollow
        this.state.unFollowedAccounts = this.state.unFollowedAccounts.delete(name);
        this.state.myIgnoredAccounts = this.state.myIgnoredAccounts.delete(name);
        accountStorage.set("unfollowed_accounts", this.state.unFollowedAccounts);

        // Update current account if only one account is linked
        if (this.state.linkedAccounts.size === 1) {
            this.setCurrentAccount(name);
        }
    }

    onUnlinkAccount(name) {
        if( ! validation.is_account_name(name, true))
            throw new Error("Invalid account name: " + name)
        
        // Unlink
        iDB.remove_from_store("linked_accounts", name);
        this.state.linkedAccounts = this.state.linkedAccounts.delete(name);

        // Add to unFollow
        this.state.unFollowedAccounts = this.state.unFollowedAccounts.add(name);
        this.checkAccountRefs();
        // Limit to maxEntries accounts
        let maxEntries = 20;
        if (this.state.unFollowedAccounts.size > maxEntries) {
            this.state.unFollowedAccounts = this.state.unFollowedAccounts.takeLast(maxEntries);
        }    
             
        accountStorage.set("unfollowed_accounts", this.state.unFollowedAccounts);        

        // Update current account if no accounts are linked
        if (this.state.linkedAccounts.size === 0) {
            this.setCurrentAccount(null);
        }

    }

    checkAccountRefs() {
        //  Simply add them to the linkedAccounts list (no need to persist them)
        var account_refs = AccountRefsStore.getState().account_refs

        account_refs.forEach(id => {
            var account = ChainStore.getAccount(id)
            if (account === undefined) {
                return
            }
            if (account) {
                this._addIgnoredAccount(account.get("name"));
            }
        })
    }

    onAddPrivateAccount(name) {
        this.state.privateAccounts = this.state.privateAccounts.add(name);
    }

    onAddPrivateContact(name) {
        this.state.privateContacts = this.state.privateContacts.add(name);
    }

    onRemovePrivateContact(name) {
        this.state.privateContacts = this.state.privateContacts.remove(name);
    }

    getPrivateAccountType(full_name) {
        const name = full_name[0] === "~" ? full_name.slice(1) : full_name;
        let res = null;
        if (this.state.privateContacts.has(name)) res = "Private Contact";
        else if (this.state.privateAccounts.has(name)) res = "Private Account";
        return res;
    }
}

export default alt.createStore(AccountStore, "AccountStore");

// @return 3 full, 2 partial, 0 none
function pubkeyThreshold(authority) {
    var available = 0
    var required = authority.get("weight_threshold")
    var key_auths = authority.get("key_auths")
    for (let k of key_auths) {
        if (PrivateKeyStore.hasKey(k.get(0))) {
            available += k.get(1)
        }
        if(available >= required) break
    }
    return available >= required ? "full" : available > 0 ? "partial" : "none"
}

// @return 3 full, 2 partial, 0 none
function addressThreshold(authority) {
    var available = 0
    var required = authority.get("weight_threshold")
    var address_auths = authority.get("address_auths")
    if( ! address_auths.size) return "none"
    var addresses = AddressIndex.getState().addresses
    for (let k of address_auths) {
        var address = k.get(0)
        var pubkey = addresses.get(address)
        if (PrivateKeyStore.hasKey(pubkey)) {
            available += k.get(1)
        }
        if(available >= required) break
    }
    return available >= required ? "full" : available > 0 ? "partial" : "none"
}

    function lsGet(key) {
        if (ls) {
            return ls.getItem(STORAGE_KEY + key);
        }
    }

    function lsSet(key, object) {
        if (ls) {
            ls.setItem(STORAGE_KEY + key, JSON.stringify(object));
        }
    }
