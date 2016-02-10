import alt from "alt-instance"
import BaseStore from "stores/BaseStore"
import { List, Map } from "immutable"

import iDB from "idb-instance";
import { Apis } from "@graphene/chain"
import { key, Aes } from "@graphene/ecc"
import { suggest_brain_key } from "../common/brainkey"
import idb_helper from "idb-helper";
import _ from "lodash";

import {WalletTcomb, PrivateKeyTcomb} from "./tcomb_structs";
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
    Represents a single wallet and related database operations.
*/
class WalletDb extends BaseStore {
    
    constructor() {
        super()
        
        this.openWallet("default")
        
        this.state = { saving_keys: false } // wallet: null, 
        
        // Confirm only works when there is a UI (this lets a mocha unit test disable it)
        this.confirm_transactions = true
        
        ChainStore.subscribe(this.checkNextGeneratedKey.bind(this))
        this.generateNextKey_pubcache = []
        
        // WalletDb use to be a plan old javascript class (not an Alt store) so
        // for now many methods need to be exported...
        this._export( // "checkNextGeneratedKey","generateNextKey",
            "getWallet","onLock","isLocked","getPrivateKey","process_transaction","getBrainKey","getBrainKeyPrivate","onCreateWallet","validatePassword","changePassword","setWalletModified","setBackupDate","setBrainkeyBackupDate","loadDbData", "update","keys", "isEmpty", "getDeterministicKeys", "importKeys", "binaryBackupRecommended", "decodeMemo", "hasDiskWallet"
        )
    }
    
    /** This method may be called again should the chain ID change */
    loadDbData() {
        return iDB.root.getProperty("current_wallet", "default")
            .then( current_wallet => this.openWallet(current_wallet) )
        
        // return idb_helper.cursor("wallet", cursor => {
        //     if( ! cursor) return false
        //     var wallet = cursor.value
        //     // Convert anything other than a string or number back into its proper type
        //     wallet.created = new Date(wallet.created)
        //     wallet.last_modified = new Date(wallet.last_modified)
        //     wallet.backup_date = wallet.backup_date ? new Date(wallet.backup_date):null
        //     wallet.brainkey_backup_date = wallet.brainkey_backup_date ? new Date(wallet.brainkey_backup_date):null
        //     try { WalletTcomb(wallet) } catch(e) {
        //         console.log("WalletDb format error", e); }
        //     wallet.wallet_object = wallet
        //     this.setState({ wallet })
        //     return false //stop iterating
        // });
    }
    
    keys(keys) {
        return keys ? 
            wallet.wallet_object.updateIn(["keys"], Map(), ks => ks.merge(keys)) :
            wallet.wallet_object.getIn(["keys"], Map())
    }
    
    // needed ?
    // blind_receipts() {
    //     return wallet.wallet_object.getIn(["blind_receipts"], Map())
    // }
    
    /**
        Change or open a wallet, this may or may not be empty.  It is necessary to call onCreateWallet to complete this process.
    */
    openWallet(name = "default") {
        let storage = new LocalStoragePersistence(
            "wallet::" + chain_config.address_prefix + "::" + name
        )
        wallet = new WalletStorage(storage)
        cwallet = new ConfidentialWallet(wallet)
        // PrivateKeyStore.setConfidentialWallet(cwallet)
    }
    
    hasDiskWallet(name) {
        let key = "LocalStoragePersistence::wallet::" + chain_config.address_prefix
        return localStorage.getItem(key) != null
    }
    
    /** Discover derived keys that are not in this wallet */
    checkNextGeneratedKey() {
        
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
        Return a clone of the wallet's data object.  The modified wallet object can be passed back in to this.update(wallet_object).  Store only serilizable types in this object.
        
        Note, it is better to update the Immutable version read from WalletDb.wallet.wallet_object then mutated and passed back into this.update(wallet_object).  
        
        @return null if locked or return a mutable wallet object (regular object)
    */
    getWallet() {
        let o = wallet.wallet_object
        return wallet.private_key ? o.toJS() : null
    }
    
    isEmpty() {
        return wallet.isEmpty()
    }
    
    /** @return {Promise} resolve immediately or after a successful unsubscribe
    */
    onLock() {
        return wallet.logout()
    }
    
    isLocked() {
        return wallet.private_key ? false : true
    }
    
    /** @return PrivateKey or null */
    getPrivateKey(public_key) {
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
        if ( ! wallet.wallet_object.has("brainkey")) throw new Error("missing brainkey")
        if ( ! wallet.private_key) throw new Error("wallet locked")
        return wallet.wallet_object.get("brainkey")
    }
    
    getBrainKeyPrivate(brainkey = this.getBrainKey()) {
        if( ! brainkey) throw new Error("missing brainkey")
        return PrivateKey.fromSeed( key.normalize_brain_key(brainkey) )
    }
    
    onCreateWallet(
        password,
        brainkey,
        unlock = false,
        public_name = "default"
    ) {
        
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
            // var password_aes = Aes.fromSeed( password )
            
            // var encryption_buffer = key.get_random_key().toBuffer()
            // encryption_key is the global encryption key (does not change even if the passsword changes)
            // var encryption_key = password_aes.encryptToHex( encryption_buffer )
            // If unlocking, local_aes_private will become the global aes_private object
            
            // var local_aes_private = Aes.fromSeed( encryption_buffer )
            
            if( ! brainkey)
                brainkey = suggest_brain_key()
            else
                brainkey = key.normalize_brain_key(brainkey)
                
            // var brainkey_private = this.getBrainKeyPrivate( brainkey )
            // var brainkey_pubkey = brainkey_private.toPublicKey().toPublicKeyString()
            // var encrypted_brainkey = local_aes_private.encryptToHex( brainkey )
            // 
            // var password_private = PrivateKey.fromSeed( password )
            // var password_pubkey = password_private.toPublicKey().toPublicKeyString()
            
            /**
            Serilizable persisterent state (JSON serilizable types only)..  This is the data used by this class and kept in walletStorage.wallet_object:
            ```js
            const empty_wallet = fromJS({
                public_name: t.Str,
                brainkey: t.maybe(t.Str),
                brainkey_sequence: t.Num,
                brainkey_backup_date: t.maybe(t.Dat),
                deposit_keys: t.maybe(t.Obj)
            })
            ```
            */
            let chain_id = Apis.instance().chain_id
            resolve(Promise.resolve()
                .then(()=> wallet.login(email, username, password, chain_id)) //and sync
                .then(()=> assert(! wallet.wallet_object.get("backup_date"), "Wallet exists: " + public_name))
                .then(()=> 
                    wallet.setState({
                        public_name,
                        brainkey,
                        brainkey_sequence: 0,
                        brainkey_backup_date
                    })
                )
                .then( ret => {
                    if( ! unlock ) wallet.logout() // TODO is this needed?
                    return ret
                }).catch( e => {
                    if( ! unlock ) wallet.logout() // TODO is this needed?
                    throw e
                })
            )
            
            // var transaction = this.transaction_update()
            // var add = idb_helper.add( transaction.objectStore("wallet"), wallet )
            // var end = idb_helper.on_transaction_end(transaction).then( () => {
            //     wallet.wallet_object = wallet
            //     this.setState({ wallet })
            //     if(unlock) aes_private = local_aes_private
            // })
            // resolve( Promise.all([ add, end ]) )
        })
    }
    
    /** This also serves as 'unlock' */
    validatePassword( password, unlock = false ) {
        let username = ""
        let email = ""
        try {
            // var password_private = PrivateKey.fromSeed( password )
            // var password_pubkey = password_private.toPublicKey().toPublicKeyString()
            // if(wallet.password_pubkey !== password_pubkey) return false
            // if( unlock ) {
            //     var password_aes = Aes.fromSeed( password )
            //     var encryption_plainbuffer = password_aes.decryptHexToBuffer( wallet.encryption_key )
            //     aes_private = Aes.fromSeed( encryption_plainbuffer )
            // }
            let chain_id = Apis.instance().chain_id
            wallet.login(email, username, password, chain_id, unlock)
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
        // return new Promise( resolve => {
        //     var wallet = wallet.wallet_object
        //     if( ! this.validatePassword( old_password ))
        //         throw new Error("wrong password")
        //     
        //     var old_password_aes = Aes.fromSeed( old_password )
        //     var new_password_aes = Aes.fromSeed( new_password )
        //     
        //     if( ! wallet.encryption_key)
        //         // This change pre-dates the live chain..
        //         throw new Error("This wallet does not support the change password feature.")
        //     var encryption_plainbuffer = old_password_aes.decryptHexToBuffer( wallet.encryption_key )
        //     wallet.encryption_key = new_password_aes.encryptToHex( encryption_plainbuffer )
        //     
        //     var new_password_private = PrivateKey.fromSeed( new_password )
        //     wallet.password_pubkey = new_password_private.toPublicKey().toPublicKeyString()
        //     
        //     if( unlock ) {
        //         aes_private = Aes.fromSeed( encryption_plainbuffer )
        //     } else {
        //         // new password, make sure the wallet gets locked
        //         aes_private = null
        //     }
        //     resolve( this.setWalletModified() )
        // })
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
        // var used_sequence = null
        
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
                // used_sequence = i
                console.log("WARN: Private key sequence " + i + " in-use. " + 
                    "I am saving the private key and will go onto the next one.")
                keys.push({ private_key, brainkey_sequence: i })
            }
        }
        
        // if(used_sequence !== null) {
        //     wallet.setState({
        //         brainkey_sequence: used_sequence + 1
        //     })
        // }
        this.importKeys(keys)
        
        // sequence = wallet.get("brainkey_sequence")
        // var private_key = key.get_brainkey_private( brainkey, sequence )
        // if( save ) {
        //     // save deterministic private keys ( the user can delete the brainkey )
        //     this.saveKey( private_key, sequence )
        //     //TODO  .error( error => ErrorStore.onAdd( "wallet", "saveKey", error ))
        //     return wallet.setState({
        //         brainkey_sequence: 1 + 0||wallet.wallet_object.get("brainkey_sequence")
        //     })
        // }
        // return { private_key, sequence }
    }
    
    /**
        Bulk import of keys, making a single backup.  Keys may be indexed by address.
        @arg {key_object|array<key_object>} key_objects
        @typedef key_object
        @property {string} key_object.public_key - must match key prefix for this chain
        @property {string} key_object.private_wif
        @property {string} key_object.import_account_names - comma separated list
        @property {boolean} key_object.index_address - true or undefined.  Set truthy only if this could be a BTS 1.0 key having a legacy address format (Protoshares, etc.).  Unless true, the user may not see some shorts or balance claims.  A private key object is requred if this is used.
        @property {boolean} key_object.brainkey_sequence
    */
    importKeys(key_objects) {
        
        let importKeys = key_objects => {
            
            if( ! Array.isArray(key_objects) && ! List.isList(key_objects))
                key_objects = [ key_objects ]
            
            let binaryBackupRecommended = false
            
            return Map().withMutations( wallet_object => {
                let max_brainkey_sequence = 0
                List(key_objects).forEach( key_object => {
                    
                    let {public_key, private_wif, import_account_names, index_address, brainkey_sequence} = key_object
                    
                    if( ! private_wif ) {
                        assert(key_object.private_key, "private_wif or private_key required")
                        assert(key_object.private_key.d, "private_key must be of PrivateKey type")
                        private_wif = key_object.private_key.toWif()
                    }
                    
                    if( key_object.brainkey_sequence !== undefined)
                        max_brainkey_sequence = Math.max(max_brainkey_sequence, key_object.brainkey_sequence)
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
                    
                    let key = {public_key, private_wif, import_account_names, index_address, brainkey_sequence}
                    wallet_object.setIn(["keys", public_key], Map(key))
                })
                
                if( max_brainkey_sequence !== undefined)
                    // Always point to an unused key
                    wallet_object.set("brainkey_sequence", 1 + max_brainkey_sequence)
                
                if(binaryBackupRecommended)
                    CachedPropertyActions.set("backup_recommended", true)
            })
        }
        return new Promise( resolve => {
            
            this.setState({ saving_keys: true })//, ()=>{
            let wallet_object = importKeys( key_objects )
            
            AddressIndex.add( this.keys()
                .reduce( (r, pubkey, key) => key.has("index_address") ? r.add(pubkey) : r, List())
            )
            
            this.keys().forEach( (key, pubkey) => ChainStore.getAccountRefsOfKey(pubkey) )
                
            resolve( wallet.setState(wallet_object)
                .then(()=> this.setState({saving_keys: false}) )
            )
            // })
        })
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
    
    // saveKeys(private_keys) {
    //     var promises = []
    //     for(let private_key_record of private_keys) {
    //         promises.push( this.saveKey(
    //             private_key_record.private_key,
    //             private_key_record.sequence
    //         ))
    //     }
    //     return Promise.all(promises)
    // }
    
    // saveKey(
    //     private_key,
    //     brainkey_sequence,
    //     import_account_names
    // ) {
    //     // var private_cipherhex = aes_private.encryptToHex( private_key.toBuffer() )
    //     
    //     if( ! public_key_string) {
    //         //S L O W
    //         // console.log('WARN: public key was not provided, this may incur slow performance')
    //         var public_key = private_key.toPublicKey()
    //         public_key_string = public_key.toPublicKeyString()
    //     } else 
    //         if(public_key_string.indexOf(chain_config.address_prefix) != 0)
    //             throw new Error("Public Key should start with " + chain_config.address_prefix)
    //     
    //     var private_key_object = {
    //         import_account_names,
    //         encrypted_key: private_cipherhex,
    //         pubkey: public_key_string,
    //         brainkey_sequence
    //     }
    //     var p1 = PrivateKeyActions.addKey(
    //         private_key_object
    //     ).then((ret)=> {
    //         if(TRACE) console.log('... WalletDb.saveKey result',ret.result)
    //         return ret
    //     })
    //     return p1
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
            // if not logged in
            if( ! cwallet.wallet.private_key )
                throw e
            
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
    
}

export var WalletDbWrapped = alt.createStore(WalletDb, "WalletDb");
export default WalletDbWrapped

function reject(error) {
    console.error( "----- WalletDb reject error -----", error)
    throw new Error(error)
}
