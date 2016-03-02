import BaseStore from "./BaseStore";
import Immutable from "immutable";
import alt from "../alt-instance";
import AccountActions from "../actions/AccountActions";
import iDB from "../idb-instance";
import WalletDb from "./WalletDb"
import { validation } from "@graphene/chain"
import { ChainStore } from "@graphene/chain"
import AccountRefsStore from "stores/AccountRefsStore"
import { AddressIndex } from "@graphene/wallet-client"
import SettingsStore from "stores/SettingsStore"
import ls from "common/localStorage";
import WalletUnlockActions from "../actions/WalletUnlockActions";

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
            onRemovePrivateContact: AccountActions.removePrivateContact,
            onWalletUnlocked: WalletUnlockActions.unlocked
        });
        WalletDb.subscribe(this.walletUpdate.bind(this))
        this._export("tryToSetCurrentAccount", "onCreateAccount",
            "getMyAccounts", "isMyAccount", "getMyAuthorityForAccount", "getAccountType");
    }
    
    _getInitialState() {
        this.account_refs = null
        return { 
            // update: false,
            currentAccount: null,
            linkedAccounts: Immutable.Set(),
            myAccounts: Immutable.Set(),
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
    
    walletUpdate() {
        if( WalletDb.isLocked() ) {
            this.setState(this._getInitialState())
            return
        }
        let keys = WalletDb.keys()
        if( this.wallet_keys === keys ) return
        this.wallet_keys = keys
        
        this.setState({
            privateAccounts: cwallet.labels(key => key.has("private_wif")),
            privateContacts: cwallet.labels(key => ! key.has("private_wif")),
        })
    }
    
    chainStoreUpdate() {

        // If either ID references (via public key) to an account or if the acccounts become available, update the account store...
        
        if( this.account_refs === AccountRefsStore.getState().account_refs &&
            this.chainstore_account_ids_by_key === ChainStore.account_ids_by_key
        ) return
        
        this.account_refs = AccountRefsStore.getState().account_refs
        this.chainstore_account_ids_by_key = ChainStore.account_ids_by_key
        
        this.pending = false
        let linkedAccounts = Immutable.Set().asMutable()
        this.account_refs.forEach(id => {
            var account = ChainStore.getAccount(id)
            if (account === undefined) {
                this.pending = true
                return
            }
            if (account) {
                const name = account.get("name");
                if (!this.state.unFollowedAccounts.includes(name)) {
                    if ( ! linkedAccounts.includes(name)) {
                        linkedAccounts.add(name);
                    }
                    const auth = this.getMyAuthorityForAccount(account);
                    if( auth === undefined ) {
                        this.pending = true
                        return
                    }
                    if ((auth === "full" || auth === "partial") && !this.state.myAccounts.includes(name)) {
                        this.state.myAccounts = this.state.myAccounts.add(account.get("name"));
                    }
                } else {
                    this._addIgnoredAccount(account.get("name"));
                }
            }
        })
        // console.log("AccountStore chainStoreUpdate linkedAccounts",this.state.linkedAccounts.size);
        this.setState({ linkedAccounts: linkedAccounts.asImmutable() }, ()=> this.tryToSetCurrentAccount())
    }
    
    getMyAccounts() {
        if (WalletDb.isLocked()) return this.state.myAccounts.toArray();
        return this.state.myAccounts.sort().toArray()
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
        if (!account) return false;
        if (WalletDb.isLocked() && this.state.myAccounts.includes(account.get("name"))) return true;

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
        if( this.pending ) return
        if (localStorage.currentAccount && this.state.linkedAccounts.has(localStorage.currentAccount)) {
            return this.setCurrentAccount(localStorage.currentAccount);
        }

        let {starredAccounts} = SettingsStore.getState();
        if (starredAccounts.size && this.state.linkedAccounts.has(starredAccounts.first())) {
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
        
        if( ! validation.is_account_name(account.name))
            throw new Error("Invalid account name: " + account.name)
        
        if(account.name == "" || this.state.linkedAccounts.get(account.name))
            return Promise.resolve()
        
        if (this.state.linkedAccounts.size === 0) {
            this.setCurrentAccount(account.name);
        }
        this.state.linkedAccounts = this.state.linkedAccounts.add(account.name);// probably un-necessary
        return Promise.resolve()
    }

    onLinkAccount(name) {
        if( ! validation.is_account_name(name, true))
            throw new Error("Invalid account name: " + name)
        
        // Link
        this.state.linkedAccounts = this.state.linkedAccounts.add(name);// probably un-necessary

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
        // Not needed, the wallet will trigger an event
    }

    onAddPrivateContact(name) {
        // Not needed, the wallet will trigger an event
    }

    onRemovePrivateContact(name) {
        // Not needed, the wallet will trigger an event
    }

    getAccountType(full_name) {
        if (!full_name) return null;
        const name = full_name[0] === "~" ? full_name.slice(1) : full_name;
        let res = null;
        if (this.state.privateContacts.has(name)) res = "Private Contact";
        else if (this.state.privateAccounts.has(name)) res = "Private Account";
        else if (this.state.myAccounts.has(name)) res = "My Account";
        else if (this.state.linkedAccounts.has(name)) res = "Linked Account";
        else if (full_name[0] === "~") return null;
        else return "Public Account";
        return res;
    }

    onWalletUnlocked() {

    }
}

export default alt.createStore(AccountStore, "AccountStore");

// @return 3 full, 2 partial, 0 none
function pubkeyThreshold(authority) {
    var available = 0
    var required = authority.get("weight_threshold")
    var key_auths = authority.get("key_auths")
    for (let k of key_auths) {
        if (WalletDb.keys().has(k.get(0))) {
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
    for (let k of address_auths) {
        var address = k.get(0)
        var pubkey = AddressIndex.getPubkey(address)
        if (WalletDb.keys().has(pubkey)) {
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
