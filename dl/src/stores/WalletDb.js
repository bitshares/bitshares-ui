import alt from "alt-instance"
import BaseStore from "stores/BaseStore"
import { List, Map, Set } from "immutable"

import iDB from "idb-instance"
import { Apis } from "@graphene/chain"
import { key, Aes } from "@graphene/ecc"
import { suggest_brain_key } from "../common/brainkey"
import idb_helper from "idb-helper";
import _ from "lodash";

import { PrivateKey } from "@graphene/ecc";
import CachedPropertyActions from "actions/CachedPropertyActions"
import TransactionConfirmActions from "actions/TransactionConfirmActions"
import WalletUnlockActions from "actions/WalletUnlockActions"
import { chain_config } from "@graphene/chain"
import { ChainStore } from "@graphene/chain"
import assert from "assert"

import {
    LocalStoragePersistence, WalletStorage, ConfidentialWallet, AddressIndex
} from "@graphene/wallet-client"

var aes_private
var transaction
var wallet, cwallet

var TRACE = false
const remote_url = "ws://localhost:9080/wallet_v1"

/**
    The Web Wallet User API (for the user-interface).
    
    This is multi-wallet, but as a singleton it holds a single wallet open at any given time.
    
    Updates the following in wallet.wallet_object:
    ```js
    const empty_wallet = fromJS({
        public_name: t.Str,
        brainkey: t.maybe(t.Str),
        brainkey_sequence: t.Num,
        brainkey_backup_date: t.maybe(t.Dat),
        chain_id: t.Str
    })
    ```
*/
class WalletDb extends BaseStore {
    
    constructor() {
        super()
        
        this.state = {
            saving_keys: false,
            current_wallet: undefined,
            wallet_names: Set()
        } 
        
        // Confirm only works when there is a UI (this lets a mocha unit test disable it)
        this.confirm_transactions = true
        
        ChainStore.subscribe(this.checkNextGeneratedKey.bind(this))
        this.generateNextKey_pubcache = []
        
        // short-cuts into the wallet's data object
        this.keys = ()=> map(wallet, "keys")
        this.deposit_keys = ()=> map(wallet, "deposit_keys")
        this.data = ()=> !( wallet && wallet.wallet_object) ? Map() : wallet.wallet_object
        this.prop = (name, default_value) => this.data().has(name) ? this.data().get(name) : default_value
        
        
        // WalletDb use to be a plan old javascript class (not an Alt store) so
        // for now many methods need to be exported...
        this._export(
            "openWallet", "getWallet", "update", "isEmpty", "importKeys","getBrainKey","deleteWallet",
            "keys", "deposit_keys", "data", "prop",
            "process_transaction", "decodeMemo","getPrivateKey","getDeterministicKeys",
            "onLock","isLocked","onCreateWallet","validatePassword","changePassword",
            "setWalletModified","setBackupDate","setBrainkeyBackupDate","binaryBackupRecommended",
            "loadDbData",
        )
    }
    
    
    /** Loads the last active wallet. */
    loadDbData() {
        
        let current_wallet
        let cur = iDB.root.getProperty("current_wallet").then( c => current_wallet = c)
        
        // All wallets new and old
        let wallet_names = Set()
        
        // wallet_names
        const prefix = "LocalStoragePersistence::wallet::" + chain_config.address_prefix + "::"
        for(let i = 0; i < localStorage.length; i++) {
            // console.log('localStorage.key('+i+')', localStorage.key(i))
            let key = localStorage.key(i)
            if(key.indexOf(prefix) === 0) 
                wallet_names = wallet_names.add( key.substring(prefix.length) )
        }
        
        // legacy wallet_names (need convertion)
        this.legacy_wallet_names = Set()
        let leg = iDB.root.getProperty("wallet_names", []).then( legacy_wallet_names => {
            
            for(let name of legacy_wallet_names)
                if(! wallet_names.has(name)) { 
                    wallet_names = wallet_names.add(name) // all wallets
                    this.legacy_wallet_names = this.legacy_wallet_names.add(name)
                }
            
        })
        
        return Promise.all([ cur, leg ])
            .then( ()=>{
                if(! wallet_names.has(current_wallet))
                    current_wallet = wallet_names.size ? wallet_names.first() : undefined
            })
            .then( ()=> this.setState({ current_wallet, wallet_names }) )
            .then( ()=> this.openWallet( current_wallet ))
    }
    
    /**
        Change or open a wallet, this may or may not be empty.  It is necessary to call onCreateWallet to complete this process.
    */
    openWallet(wallet_name) {
        
        if(! wallet_name)
            return
        
        if(this.legacy_wallet_names.has(wallet_name)) {
            console.error("WalletDb\tTODO convert legacy wallet")
            return
        }
        
        let key = "wallet::" + chain_config.address_prefix + "::" + wallet_name
        let storage = new LocalStoragePersistence( key )
        let _wallet = new WalletStorage(storage)
        let _cwallet = new ConfidentialWallet(_wallet)
        
        // No exceptions so update state:
        wallet = _wallet
        cwallet = _cwallet
        
        this.setState({ current_wallet: wallet_name, wallet, cwallet }) // public
        iDB.root.setProperty("current_wallet", wallet_name)
    }
    
    deleteWallet(wallet_name) {
        if( ! this.state.wallet_names.has(wallet_name) )
            throw new Error("Can't delete wallet '"+ wallet_name + "', does not exist")
        
        if(this.legacy_wallet_names.has(wallet_name)) {
            this.legacy_wallet_names = this.legacy_wallet_names.remove(wallet_name)
            var database_name = iDB.getDatabaseName(wallet_name)
            iDB.impl.deleteDatabase(database_name)
            iDB.root.setProperty("wallet_names", this.legacy_wallet_names)
        }
        else {
            let key = "wallet::" + chain_config.address_prefix + "::" + wallet_name
            localStorage.removeItem("LocalStoragePersistence::" + key)
        }
        
        let wallet_names = this.state.wallet_names.remove(wallet_name)
        
        let current_wallet = this.state.current_wallet
        if(current_wallet === wallet_name) {
            current_wallet = wallet_names.size ? wallet_names.first() : undefined
            iDB.root.setProperty("current_wallet", current_wallet)
        }
        
        this.setState({ current_wallet, wallet_names })
    }
    
    /** Discover derived keys that are not in this wallet */
    checkNextGeneratedKey() {
        
        if( ! wallet ) return // not opened
        if( ! wallet.private_key ) return // locked
        if( ! wallet.wallet_object.has("brainkey")) return // no brainkey
        
        if(this.chainstore_account_ids_by_key === ChainStore.account_ids_by_key)
            return // no change
            
        this.chainstore_account_ids_by_key = ChainStore.account_ids_by_key
        // Helps to ensure we are looking at an un-used key
        try { this.generateNextKey() } catch(e) {
            console.error(e, "stack", e.stack) }
    }
    
    
    /**
        Return a mutable clone of the wallet's data object.  The modified wallet object can be passed back in to this.update(wallet_object) for merging.
        
        Programmers should instead use Immutable data from functions like WalletDb.data() (see constructor for short-hand functions).  If updating, it is better to update the Immutable version `WalletDb.data()` and passed back into this.update(data).  
        
        Store only serilizable types in this object.
        
        @return null if locked or return a mutable wallet object (regular object)
    */
    getWallet() {
        if( this.isLocked() ) return null
        return wallet.wallet_object.toJS()
    }
    
    
    isEmpty() {
        return ! wallet || wallet.isEmpty()
    }
    
    /** @return {Promise} resolve immediately or after a successful unsubscribe
    */
    onLock() {
        if( ! wallet) return
        return wallet.logout()
        .then( ()=> this.setState({lock_event: Date.now()}) )
    }
    
    isLocked() {
        return ! ( wallet && wallet.private_key )
    }
    
    /** @return PrivateKey or null */
    getPrivateKey(public_key) {
        if(! cwallet) return
        if(! public_key) return null
        return cwallet.getPrivateKey(public_key)
    }
    
    process_transaction(tr, signer_pubkeys, broadcast) {
        return WalletUnlockActions.unlock().then( () =>
            this.confirm_transactions ?
                tr.process_transaction(cwallet, signer_pubkeys, false).then(()=>
                    TransactionConfirmActions.confirm(tr)
                )
            : tr.process_transaction(cwallet, signer_pubkeys, broadcast)
        )
    }
    
    getBrainKey() {
        assertLogin()
        return wallet.wallet_object.get("brainkey")
    }
    
    // getBrainKeyPrivate(brainkey = this.getBrainKey()) {
    //     if( ! brainkey) throw new Error("missing brainkey")
    //     return PrivateKey.fromSeed( key.normalize_brain_key(brainkey) )
    // }
    
    /** Call openWallet first, unless creating the default wallet */
    onCreateWallet( password, brainkey ) {
        
        let email = ""
        let username = ""
        
        return new Promise( (resolve, reject) => {
            if( typeof password !== 'string')
                throw new Error("password string is required")
            
            var brainkey_backup_date
            if(brainkey) {
                if(typeof brainkey !== "string")
                    throw new Error("Brainkey must be a string")
                
                if(brainkey.trim() === "")
                    throw new Error("Brainkey can not be an empty string")
            
                if(brainkey.trim().length < 50)
                    throw new Error("Brainkey must be at least 50 characters long")

                // The user just provided the Brainkey so this avoids
                // bugging them to back it up again.
                brainkey_backup_date = new Date()
            }
            
            if( ! brainkey)
                brainkey = suggest_brain_key()
            else
                brainkey = key.normalize_brain_key(brainkey)
                
            let chain_id = Apis.instance().chain_id
            resolve(Promise.resolve()
            
                .then(()=> wallet.login(email, username, password, chain_id)) //login and sync
                
                .then(()=> assert(wallet.wallet_object.get("created"),
                    "Wallet exists: " + this.state.current_wallet))
                
                .then(()=> {
                    let wallet_names = this.state.wallet_names.add(this.state.current_wallet)
                    this.setState({ wallet_names })
                })
                
                .then(()=>
                    wallet.setState({
                        public_name: this.state.current_wallet,
                        brainkey,
                        brainkey_sequence: 0,
                        brainkey_backup_date,
                        chain_id
                    })
                )
                .catch( error => {
                    wallet.logout()
                    throw error
                })
            )
        })
    }
    
    /** This also serves as 'unlock' */
    validatePassword( password, unlock = false ) {
        let username = ""
        let email = ""
        try {
            if( unlock ) {
                
                let chain_id = Apis.instance().chain_id
                wallet.login(email, username, password, chain_id)
                .then( ()=> AccountRefsStore.loadDbData() )
                .then( ()=> this.setState({lock_event: Date.now()}) )
                
            } else {
                wallet.validatePassword(email, username, password)
            }
            return true
        } catch(e) {
            
            if( ! /invalid_password/.test(e.toString()))
                console.error(e, 'stack', e.stack)
            
            return false
        }
    }
    
    /** This may will unlock the wallet. */
    changePassword( old_password, new_password ) {
        let username = ""
        let email = ""
        return wallet.changePassword( email, username, old_password, new_password )
    }
    
    /**
        Creates the same set of keys until the keys are saved in the wallet (passed into WalletDb.importKeys).
        
        @arg {number} count
        @return {array} - [{ private_key: PrivateKey, brainkey_sequence: number }]
    */ 
    getDeterministicKeys( count ) {
        var brainkey = this.getBrainKey()
        var sequence = wallet.get("brainkey_sequence") || 0
        let keys = List()
        for(let i = 0; i < count; i++)
            keys = keys.push({
                private_key: key.get_brainkey_private( brainkey, sequence + i ),
                brainkey_sequence: sequence + i
            })
        return keys.toJS()
    }
    
    /** 
        Used in for Advanced mode for brainkey recovery.  This is bound to ChainStore events.
        
        @private
        
        @throws "missing brainkey", "wallet locked"
        @return { private_key, sequence }
    */
    generateNextKey() {
        var brainkey = this.getBrainKey()
        var sequence = wallet.wallet_object.get("brainkey_sequence") || 0
        
        // Skip ahead in the sequence if any keys are found in use
        // Slowly look ahead (1 new key per block) to keep the wallet fast after unlocking
        this.brainkey_look_ahead = Math.min(10, (this.brainkey_look_ahead||0) + 1)
        
        let keys = []
        for (var i = sequence; i < sequence + this.brainkey_look_ahead; i++) {
            var private_key = key.get_brainkey_private( brainkey, i )
            var pubkey =
                this.generateNextKey_pubcache[i] ?
                this.generateNextKey_pubcache[i] :
                this.generateNextKey_pubcache[i] =
                private_key.toPublicKey().toPublicKeyString()
            
            var next_key = ChainStore.getAccountRefsOfKey( pubkey )
            
            if(next_key && next_key.size) {
                console.log("WARN: Private key sequence " + i + " in-use. " + 
                    "I am saving the private key and will go onto the next one.")
                keys.push({ private_key, brainkey_sequence: i })
            }
        }
        if( keys.length )
            this.importKeys(keys)
    }
    
    /**
        Bulk import of keys, making a single backup.  Keys may be indexed by address.
        @arg {key_object|array<key_object>} key_objects
        @typedef key_object
        @property {string} key_object.public_key - must match key prefix for this chain
        @property {string} key_object.private_wif
        @property {string} key_object.import_account_names - comma separated list
        @property {boolean} key_object.index_address - true|undefined.  Set truthy only if this could be a BTS 1.0 key having a legacy address format (Protoshares, etc.).  Unless true, the user may not see some shorts or balance claims.  A private key object is requred if this is used.
        @property {boolean} key_object.brainkey_sequence
    */
    importKeys(key_objects) {
        
        let importKeys = key_objects => {
            
            if( ! Array.isArray(key_objects) && ! List.isList(key_objects))
                key_objects = [ key_objects ]
            
            let binaryBackupRecommended = false
            
            return Map().withMutations( wallet_object => {
                let max_brainkey_sequence = undefined
                List(key_objects).forEach( key_object => {
                    
                    let {public_key, private_wif, import_account_names, index_address, brainkey_sequence} = key_object
                    
                    if( ! private_wif ) {
                        assert(key_object.private_key, "private_wif or private_key required")
                        assert(key_object.private_key.d, "private_key must be of PrivateKey type")
                        private_wif = key_object.private_key.toWif()
                    }
                    
                    if( key_object.brainkey_sequence !== undefined)
                        max_brainkey_sequence = Math.max(max_brainkey_sequence||0, key_object.brainkey_sequence)
                    else
                        binaryBackupRecommended = true
                    
                    if( ! public_key ) {
                        assert(private_key, "Private key required")
                        // toPublicKey  S L O W
                        public_key = PrivateKey.fromWif(private_wif).toPublicKey().toString()
                    } else {
                        if(public_key.indexOf(chain_config.address_prefix) != 0)
                            throw new Error("Public Key should start with " + chain_config.address_prefix)
                    }
                    
                    if( index_address ) {
                        assert(private_key, "private_key required to derive addresses")
                    }
                    
                    let key = {public_key, private_wif, brainkey_sequence}
                    if(import_account_names != null) key.import_account_names = import_account_names
                    if(index_address != null) key.index_address = index_address
                    
                    wallet_object.setIn(["keys", public_key], Map(key))
                })
                
                if( max_brainkey_sequence !== undefined)
                    // Always point to an unused key
                    wallet_object.set("brainkey_sequence", 1 + max_brainkey_sequence)
                
                if(binaryBackupRecommended)
                    CachedPropertyActions.set("backup_recommended", true)
            })
        }
        
        this.setState({ saving_keys: true })
        let wallet_object = importKeys( key_objects )
        let p = wallet.setState(wallet_object)
            .then(()=> this.setState({saving_keys: false}) )
        
        AddressIndex.add( this.keys()
            .reduce( (r, key, pubkey) => key.get("index_address") ? r.add(pubkey) : r, List())
        )
        
        this.keys().forEach( (key, pubkey) => ChainStore.getAccountRefsOfKey(pubkey) )
        // this.keys().forEach( (key, pubkey) => console.log('imported',pubkey) )
        return p
    }
    
    // /**
    //     @arg  {array} private_key_objs
    //     @arg {string} private_key_objs.private_plainhex
    //     @arg  {array} private_key_objs.import_account_names
    //     @arg {string} private_key_objs.public_key_string
    // */
    // importKeysWorker(private_key_objs) {
    //     var _this = this
    //     worker.onmessage = event => { try {
    //         console.log("Preparing for private keys save");
    //         var private_cipherhex_array = event.data
    //         var enc_private_key_objs = []
    //         for(let i = 0; i < private_key_objs.length; i++) {
    //             var private_key_obj = private_key_objs[i]
    //             var {import_account_names, public_key_string, private_plainhex} = private_key_obj
    //             var private_cipherhex = private_cipherhex_array[i]
    //             if( ! public_key_string) {
    //                 // console.log('WARN: public key was not provided, this will incur slow performance')
    //                 var private_key = PrivateKey.fromHex(private_plainhex)
    //                 var public_key = private_key.toPublicKey() // S L O W
    //                 public_key_string = public_key.toPublicKeyString()
    //             } else
    //                 if(public_key_string.indexOf(chain_config.address_prefix) != 0)
    //                     throw new Error("Public Key should start with " + chain_config.address_prefix)
    //             
    //             var private_key_object = {
    //                 import_account_names,
    //                 encrypted_key: private_cipherhex,
    //                 pubkey: public_key_string
    //                 // null brainkey_sequence
    //             }
    //             enc_private_key_objs.push(private_key_object)
    //         }
    //         console.log("Saving private keys", new Date().toString());
    //         var transaction = _this.transaction_update_keys()
    //         var insertKeysPromise = idb_helper.on_transaction_end(transaction)
    //         try {
    //             var duplicate_count = PrivateKeyStore
    //                 .addPrivateKeys_noindex(enc_private_key_objs, transaction )
    //             if( private_key_objs.length != duplicate_count )
    //                 _this.setWalletModified(transaction)
    //             _this.setState({saving_keys: false})
    //             resolve(Promise.all([ insertKeysPromise, addyIndexPromise ]).then( ()=> {
    //                 console.log("Done saving keys", new Date().toString())
    //                 // return { duplicate_count }
    //             }))
    //         } catch(e) {
    //             transaction.abort()
    //             console.error(e)
    //             reject(e)
    //         }
    //     } catch( e ) { console.error('AesWorker.encrypt', e) }}
    // }
    
    setWalletModified() {
        return wallet.setState(
            wallet.wallet_object.set("backup_date", new Date().toISOString())
        )
    }
    
    setBackupDate() {
        return wallet.setState(
            wallet.wallet_object.set("backup_date", new Date().toISOString())
        )
    }
    
    setBrainkeyBackupDate() {
        return wallet.setState(
            wallet.wallet_object.set("brainkey_backup_date", new Date().toISOString())
        )
    }
    
    binaryBackupRecommended() {
        CachedPropertyActions.set("backup_recommended", true)
    }
    
    decodeMemo(memo) {
        let lockedWallet = false;
        let memo_text, isMine = false;
        try {
            let from_private_key = cwallet.getPrivateKey(memo.from)
            let to_private_key = cwallet.getPrivateKey(memo.to)
            let private_key = from_private_key ? from_private_key : to_private_key;
            let public_key = from_private_key ? memo.to : memo.from;
            
            try {
                memo_text = private_key ? Aes.decrypt_with_checksum(
                    private_key,
                    public_key,
                    memo.nonce,
                    memo.message
                ).toString("utf-8") : null;
            } catch(e) {
                console.log("transfer memo exception ...", e);
                memo_text = "*";
            }
        }
        catch(e) {
            // Failed because wallet is locked
            lockedWallet = true;
            // private_key = null;
            isMine = true;
        }
        return {
            text: memo_text,
            isMine
        }
    }
    
    /** Saves wallet object to disk.  Always updates the last_modified date. */
    update(wallet_object) {
        if ( ! wallet) {
            reject("missing wallet")
            return
        }
        return this.wallet.setState(wallet_object)
    }
    
    // /** Might be useful when RAM wallets are implemented */
    // hasDiskWallet(name = this.getState().get("current_wallet")) {
    //     let key = "LocalStoragePersistence::wallet::" + chain_config.address_prefix
    //     return localStorage.getItem(key) != null
    // }
    
}

export var WalletDbWrapped = alt.createStore(WalletDb, "WalletDb");
export default WalletDbWrapped

function reject(error) {
    console.error( "----- WalletDb reject error -----", error)
    throw new Error(error)
}

/**
    @arg {string} name of a Map within the wallet
    
    @return Immuable Map from the wallets data object or an emtpy map if locked or non-existent)
*/
function map(wallet, name) {
    assert( name, "name is required")
    if(! wallet || ! wallet.wallet_object) return Map()
    return wallet.wallet_object.get(name, Map())
}

function assertLogin() {
    if( ! wallet || ! wallet.private_key )
        throw new Error("wallet is locked")
}