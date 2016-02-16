import alt from "alt-instance"
import BaseStore from "stores/BaseStore"
import { List, Map, Set, fromJS } from "immutable"

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
            "logout","isLocked","onCreateWallet","login","changePassword",
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
        
        // legacy wallet_names
        this.legacy_wallet_names = Set()
        let leg = iDB.root.getProperty("wallet_names", []).then( legacy_wallet_names => {
            for(let name of legacy_wallet_names) {
                wallet_names = wallet_names.add(name)
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
        
        if(! wallet_name) {
            this.setState({ current_wallet: undefined, wallet: undefined, cwallet: undefined })
            wallet = undefined
            cwallet = undefined
            return
        }
        
        if( wallet_name === this.state.current_wallet)
            return { wallet }
        
        console.log("WalletDb\topenWallet", wallet_name);
        let key = "wallet::" + chain_config.address_prefix + "::" + wallet_name
        let storage = new LocalStoragePersistence( key )
        let _wallet = new WalletStorage(storage)
        let _cwallet = new ConfidentialWallet(_wallet)
        
        // No exceptions so update state:
        cwallet = _cwallet
        wallet = _wallet
        let wallet_names = this.state.wallet_names.add(wallet_name)
        this.setState({ current_wallet: wallet_name, wallet_names, wallet, cwallet }) // public
        iDB.root.setProperty("current_wallet", wallet_name)
        
        return { wallet }
    }
    
    deleteWallet(wallet_name) {
        if( ! this.state.wallet_names.has(wallet_name) )
            throw new Error("Can't delete wallet '"+ wallet_name + "', does not exist")
        
        if(this.legacy_wallet_names.has(wallet_name)) {
            var database_name = iDB.getDatabaseName(wallet_name)
            iDB.impl.deleteDatabase(database_name)
            this.legacy_wallet_names = this.legacy_wallet_names.remove(wallet_name)
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
            this.openWallet(current_wallet)
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
        if( ! wallet) return true
        if( this.legacy_wallet_names.has(this.state.current_wallet)) return false
        return wallet.isEmpty()
    }
    
    /** @return {Promise} resolve immediately or after a successful unsubscribe
    */
    logout() {
        if( ! wallet) return
        return wallet.logout().then( ()=> this.setState({lock_event: Date.now()}) )
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
    
    login( password ) {
        
        assert(this.isLocked(), "Wallet is already unlocked")
        
        let email = ""
        let username = ""
        
        // Check after wallet.login...
        let is_legacy = ()=>
            // Has not been converted already.
            wallet.isEmpty() &&
            // Is or was a legacy wallet.
            this.legacy_wallet_names.has(this.state.current_wallet)
        
        let legacy_upgrade = ()=> {
            return iDB.legacyBackup()
            .then( legacy_backup =>{
                wallet.wallet_object = legacyUpgrade(password, legacy_backup)
                // create the new wallet
                return wallet.login(email, username, password, Apis.chainId())
            })
        }
        
        return Promise.resolve()
        .then( ()=> is_legacy() ? legacy_upgrade() : wallet.login(email, username, password, Apis.chainId()) )
        .then( ()=> AccountRefsStore.loadDbData() )
        .then( ()=> this.setState({lock_event: Date.now()}) )
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
            // console.log('WalletDb\tgenerateNextKey', !!this.generateNextKey_pubcache[i],i)
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
        @property {string} key_object.private_wif - or private_key object
        @property {string} key_object.import_account_names - comma separated list
        @property {boolean} key_object.index_address - true|undefined.  Set truthy only if this could be a BTS 1.0 key having a legacy address format (Protoshares, etc.).  Unless true, the user may not see some shorts or balance claims.  A private key object is requred if this is used.
        @property {number} key_object.brainkey_sequence
    */
    importKeys(key_objects) {
        
        this.setState({ saving_keys: true })
        
        let { wallet_object, binaryBackupRecommended } = importKeyWalletObject( wallet.wallet_object, key_objects )
        if(binaryBackupRecommended)
            CachedPropertyActions.set("backup_recommended", true)
        
        let p = wallet.setState(wallet_object)
            .then(()=> this.setState({saving_keys: false}) )
        
        AddressIndex.add( this.keys()
            .reduce( (r, key, pubkey) => key.get("index_address") ? r.push(pubkey) : r, List())
        )
        
        // this.keys().forEach( (key, pubkey) => ChainStore.getAccountRefsOfKey(pubkey) )
        // this.keys().forEach( (key, pubkey) => console.log('imported',pubkey) )
        return p
    }
    
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
        return wallet.setState(wallet_object)
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

let importKeyWalletObject = (wallet_object, key_objects) => {
    
    if( ! Array.isArray(key_objects) && ! List.isList(key_objects))
        key_objects = [ key_objects ]
    
    let binaryBackupRecommended = false
    
    wallet_object = Map(wallet_object).withMutations( wallet_object => {
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
                assert(private_wif, "private key required to derive addresses")
            }
            
            let key = {public_key, private_wif}
            
            if(import_account_names != null) key.import_account_names = import_account_names
            if(brainkey_sequence != null) key.brainkey_sequence = brainkey_sequence
            if(index_address != null) key.index_address = index_address
            
            wallet_object.setIn(["keys", public_key], Map(key))
        })
        
        if( max_brainkey_sequence !== undefined)
            // Always point to an unused key
            wallet_object.set("brainkey_sequence", 1 + max_brainkey_sequence)
        
        
    })
    return  { wallet_object, binaryBackupRecommended }
}

export function legacyUpgrade(password, legacy_backup) {

    let legacy_wallet = legacy_backup.wallet[0]
    if( legacy_wallet.chain_id !== Apis.chainId())
        throw new Error("Missmatched chain id, backup has " + legacy_wallet.chain_id + " but this connection is expecting " + Apis.chainId())
    
    let password_private = PrivateKey.fromSeed( password || "" )
    let password_pubkey = password_private.toPublicKey().toString()
    if(legacy_wallet.password_pubkey !== password_pubkey)
        throw new Error("invalid_password")
    
    console.info("WalletDb\tconverting legacy wallet")
    let aes = Aes.fromSeed( Aes.fromSeed( password ).decryptHexToBuffer( legacy_wallet.encryption_key ) )
    let dt = val => val ? val["toISOString"] ? val.toISOString() : new Date(val).toISOString() : val
    
    let new_wallet = Map({
        public_name: legacy_wallet.public_name,
        created: dt(legacy_wallet.created),
        brainkey: aes.decryptHexToText(legacy_wallet.encrypted_brainkey),
        backup_date: dt(legacy_wallet.backup_date),
        brainkey_backup_date: dt(legacy_wallet.brainkey_backup_date),
        brainkey_sequence: legacy_wallet.brainkey_sequence,
    })
    let keys = []
    for(let key of legacy_backup.private_keys) {
        keys.push({
            private_key: PrivateKey.fromBuffer(
                new Buffer(aes.decryptHex(key.encrypted_key), 'hex')),
            import_account_names: key.import_account_names.join(", "),
            brainkey_sequence: key.brainkey_sequence,
            public_key: key.pubkey,
            index_address: true
        })
    }
    let { wallet_object, binaryBackupRecommended } = importKeyWalletObject( new_wallet, keys )
    if(legacy_wallet.deposit_keys)
        wallet_object = wallet_object.set("deposit_keys", fromJS(legacy_wallet.deposit_keys))
    
    return wallet_object
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
