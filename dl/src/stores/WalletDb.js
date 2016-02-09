import alt from "alt-instance"
import BaseStore from "stores/BaseStore"

import iDB from "idb-instance";
import { Apis } from "@graphene/chain"
import { key } from "@graphene/ecc"
import { suggest_brain_key } from "../common/brainkey"
import idb_helper from "idb-helper";
import _ from "lodash";

import PrivateKeyStore from "stores/PrivateKeyStore"
import {WalletTcomb, PrivateKeyTcomb} from "./tcomb_structs";
import { PrivateKey } from "@graphene/ecc";
import TransactionConfirmActions from "actions/TransactionConfirmActions"
import WalletUnlockActions from "actions/WalletUnlockActions"
import PrivateKeyActions from "actions/PrivateKeyActions"
import { chain_config } from "@graphene/chain"
import { ChainStore } from "@graphene/chain"
import AddressIndex from "stores/AddressIndex"

import { LocalStoragePersistence, WalletStorage, ConfidentialWallet} from "@graphene/wallet-client"

var aes_private
var transaction
var wallet, cwallet

var TRACE = false
const remote_url = "ws://localhost:9080/wallet_v1"

/** Represents a single wallet and related indexedDb database operations. */
class WalletDb extends BaseStore {
    
    constructor() {
        super()
        
        this.openWallet("default")
        
        this.state = { wallet: null, saving_keys: false }
        
        // Confirm only works when there is a UI (this disables for mocha unit tests)
        this.confirm_transactions = true
        
        ChainStore.subscribe(this.checkNextGeneratedKey.bind(this))
        this.generateNextKey_pubcache = []
        
        // WalletDb use to be a plan old javascript class (not an Alt store) so
        // for now many methods need to be exported...
        this._export(
            "checkNextGeneratedKey","getWallet","onLock","isLocked","getPrivateKey","process_transaction","transaction_update","transaction_update_keys","getBrainKey","getBrainKeyPrivate","onCreateWallet","validatePassword","changePassword","generateNextKey","incrementBrainKeySequence","saveKeys","saveKey","setWalletModified","setBackupDate","setBrainkeyBackupDate","_updateWallet","loadDbData",
            "importKeysWorker"
        )

    }
    
    /**
        Change or open a wallet, this may or may not be empty.  It is necessary to call onCreateWallet to complete this process.
    */
    openWallet(name) {
        let storage = new LocalStoragePersistence("wallet::" + name)
        wallet = new WalletStorage(storage)
        cwallet = new ConfidentialWallet(wallet)
        PrivateKeyStore.setConfidentialWallet(cwallet)
    }
    
    /** Discover derived keys that are not in this wallet */
    checkNextGeneratedKey() {
        if( ! wallet.private_key ) return // locked
        if( ! wallet.wallet_object.has("brainkey")) return // no brainkey
        if(this.chainstore_account_ids_by_key === ChainStore.account_ids_by_key)
            return // no change
        this.chainstore_account_ids_by_key = ChainStore.account_ids_by_key
        // Helps to ensure we are looking at an un-used key
        try { this.generateNextKey( false /*save*/ ) } catch(e) {
            console.error(e) }
    }
    
    /** @return null if locked or return a wallet object (regular object, not immutable) */
    getWallet() {
        return wallet.private_key ? wallet.wallet_object.toJS() : null
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
    
    // transaction_update() {
    //     var transaction = iDB.instance().db().transaction(
    //         ["wallet"], "readwrite"
    //     )
    //     return transaction
    // }
    // 
    // transaction_update_keys() {
    //     var transaction = iDB.instance().db().transaction(
    //         ["wallet", "private_keys"], "readwrite"
    //     )
    //     return transaction
    // }
    
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
        let username = "" // TODO
        
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
            resolve(Promise.resolve()
                .then(()=> wallet.login(email, username, password)) //and sync
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
            wallet.login(email, username, password, null, unlock)
            return true
        } catch(e) {
            console.error(e)
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
    
    /** @throws "missing brainkey", "wallet locked"
        @return { private_key, sequence }
    */
    generateNextKey(save = true) {
        var brainkey = this.getBrainKey()
        var sequence = wallet.get("brainkey_sequence")
        var used_sequence = null
        
        // Skip ahead in the sequence if any keys are found in use
        // Slowly look ahead (1 new key per block) to keep the wallet fast after unlocking
        this.brainkey_look_ahead = Math.min(10, (this.brainkey_look_ahead||0) + 1)
        
        for (var i = sequence; i < sequence + this.brainkey_look_ahead; i++) {
            var private_key = key.get_brainkey_private( brainkey, i )
            var pubkey =
                this.generateNextKey_pubcache[i] ?
                this.generateNextKey_pubcache[i] :
                this.generateNextKey_pubcache[i] =
                private_key.toPublicKey().toPublicKeyString()
            
            var next_key = ChainStore.getAccountRefsOfKey( pubkey )
            
            if(next_key && next_key.size) {
                used_sequence = i
                console.log("WARN: Private key sequence " + used_sequence + " in-use. " + 
                    "I am saving the private key and will go onto the next one.")
                this.saveKey( private_key, used_sequence )
            }
        }
        if(used_sequence !== null) {
            wallet.setState({
                brainkey_sequence: used_sequence + 1
            })
        }
        sequence = wallet.get("brainkey_sequence")
        var private_key = key.get_brainkey_private( brainkey, sequence )
        if( save ) {
            // save deterministic private keys ( the user can delete the brainkey )
            this.saveKey( private_key, sequence )
            //TODO  .error( error => ErrorStore.onAdd( "wallet", "saveKey", error ))
            this.incrementBrainKeySequence()
        }
        return { private_key, sequence }
    }
    
    incrementBrainKeySequence( transaction ) {
        // NOTE, this is incrementing in RAM right away this can't be out-of-sync
        return wallet.setState({
            brainkey_sequence: wallet.wallet_object.get("brainkey_sequence")
        })
        // var wallet = wallet.wallet_object
        // wallet.brainkey_sequence ++
        // // update last modified
        // return this._updateWallet( transaction )
    }
    
    /**
        @arg  {array} private_key_objs
        @arg {string} private_key_objs.private_plainhex
        @arg  {array} private_key_objs.import_account_names
        @arg {string} private_key_objs.public_key_string
    */
    importKeysWorker(private_key_objs) {
        
        return new Promise( (resolve, reject) => {
            var pubkeys = []
            for(let private_key_obj of private_key_objs)
                pubkeys.push( private_key_obj.public_key_string )
            var addyIndexPromise = AddressIndex.add(pubkeys)
            
            var private_plainhex_array = []
            for(let private_key_obj of private_key_objs)
                private_plainhex_array.push( private_key_obj.private_plainhex )
            
            // var AesWorker = require("worker!workers/AesWorker")
            // var worker = new AesWorker
            // worker.postMessage({
            //     private_plainhex_array,
            //     key: aes_private.key, iv: aes_private.iv
            // })
            this.setState({ saving_keys: true }, ()=>{
                
                console.log("Preparing for private keys save")
                
                let wallet_object = this.wallet.wallet_object.withMutations( obj => {
                    let indexables = List().asMutable()
                    for(let i = 0; i < private_key_objs.length; i++) {
                        var private_key_obj = private_key_objs[i]
                        
                        let {import_account_names, public_key_string, private_plainhex} = private_key_obj
                        
                        let private_key = private_plainhex ? PrivateKey.fromHex(private_plainhex) : null
                        
                        if( ! public_key_string ) {
                            assert(private_key, "Private key required")
                            public_key_string = private_key.toPublicKey().toString() // S L O W
                        } else {
                            if(public_key_string.indexOf(chain_config.address_prefix) != 0)
                                throw new Error("Public Key should start with " + chain_config.address_prefix)
                        }
                        obj.updateIn(["keys", public_key_string], Map(),
                            key => key.withMutations( key =>{
                                
                                if( import_account_names )
                                    key.set("label", import_account_names.join(", "))
                                
                                // wallet restore needs to know which keys require addresses
                                key.set("index_address", true)
                                
                                if( private_key )
                                    key.set("private_wif", private_key.toWif())
                                
                                if( index_address )
                                    indexables.push(public_key)
                                
                                return key
                            })
                        )
                    }
                    cwallet.addressIndex.add( indexables.asImmutable() )
                })
                resolve( wallet.setState(wallet_object)
                    .then(()=> this.setState({saving_keys: false}) )
                )
            })
            // var _this = this
            // worker.onmessage = event => { try {
            //     console.log("Preparing for private keys save");
            //     var private_cipherhex_array = event.data
            //     var enc_private_key_objs = []
            //     for(let i = 0; i < private_key_objs.length; i++) {
            //         var private_key_obj = private_key_objs[i]
            //         var {import_account_names, public_key_string, private_plainhex} = private_key_obj
            //         var private_cipherhex = private_cipherhex_array[i]
            //         if( ! public_key_string) {
            //             // console.log('WARN: public key was not provided, this will incur slow performance')
            //             var private_key = PrivateKey.fromHex(private_plainhex)
            //             var public_key = private_key.toPublicKey() // S L O W
            //             public_key_string = public_key.toPublicKeyString()
            //         } else
            //             if(public_key_string.indexOf(chain_config.address_prefix) != 0)
            //                 throw new Error("Public Key should start with " + chain_config.address_prefix)
            //         
            //         var private_key_object = {
            //             import_account_names,
            //             encrypted_key: private_cipherhex,
            //             pubkey: public_key_string
            //             // null brainkey_sequence
            //         }
            //         enc_private_key_objs.push(private_key_object)
            //     }
            //     console.log("Saving private keys", new Date().toString());
            //     var transaction = _this.transaction_update_keys()
            //     var insertKeysPromise = idb_helper.on_transaction_end(transaction)
            //     try {
            //         var duplicate_count = PrivateKeyStore
            //             .addPrivateKeys_noindex(enc_private_key_objs, transaction )
            //         if( private_key_objs.length != duplicate_count )
            //             _this.setWalletModified(transaction)
            //         _this.setState({saving_keys: false})
            //         resolve(Promise.all([ insertKeysPromise, addyIndexPromise ]).then( ()=> {
            //             console.log("Done saving keys", new Date().toString())
            //             // return { duplicate_count }
            //         }))
            //     } catch(e) {
            //         transaction.abort()
            //         console.error(e)
            //         reject(e)
            //     }
            // } catch( e ) { console.error('AesWorker.encrypt', e) }}
        })
    }
    
    saveKeys(private_keys) {
        var promises = []
        for(let private_key_record of private_keys) {
            promises.push( this.saveKey(
                private_key_record.private_key,
                private_key_record.sequence
            ))
        }
        return Promise.all(promises)
    }
    
    saveKey(
        private_key,
        brainkey_sequence,
        import_account_names
    ) {
        // var private_cipherhex = aes_private.encryptToHex( private_key.toBuffer() )
        
        if( ! public_key_string) {
            //S L O W
            // console.log('WARN: public key was not provided, this may incur slow performance')
            var public_key = private_key.toPublicKey()
            public_key_string = public_key.toPublicKeyString()
        } else 
            if(public_key_string.indexOf(chain_config.address_prefix) != 0)
                throw new Error("Public Key should start with " + chain_config.address_prefix)
        
        var private_key_object = {
            import_account_names,
            encrypted_key: private_cipherhex,
            pubkey: public_key_string,
            brainkey_sequence
        }
        var p1 = PrivateKeyActions.addKey(
            private_key_object
        ).then((ret)=> {
            if(TRACE) console.log('... WalletDb.saveKey result',ret.result)
            return ret
        })
        return p1
    }
    
    setWalletModified(transaction) {
        return this._updateWallet( transaction )
    }
    
    setBackupDate() {
        var wallet = wallet.wallet_object
        wallet.backup_date = new Date()
        return this._updateWallet()
    }
    
    setBrainkeyBackupDate() {
        var wallet = wallet.wallet_object
        wallet.brainkey_backup_date = new Date()
        return this._updateWallet()
    }
    
    /** Saves wallet object to disk.  Always updates the last_modified date. */
    _updateWallet(transaction = this.transaction_update()) {
        var wallet = wallet.wallet_object
        if ( ! wallet) {
            reject("missing wallet")
            return
        }
        //DEBUG console.log('... wallet',wallet)
        var wallet_clone = _.cloneDeep( wallet )
        wallet_clone.last_modified = new Date()
        
        WalletTcomb(wallet_clone) // validate
        
        var wallet_store = transaction.objectStore("wallet")
        var p = idb_helper.on_request_end( wallet_store.put(wallet_clone) )
        var p2 = idb_helper.on_transaction_end( transaction  ).then( () => {
            wallet.wallet_object = wallet_clone
            this.setState({ wallet: wallet_clone })
        })
        return Promise.all([p,p2])
    }

    /** This method may be called again should the main database change */
    loadDbData() {
        return idb_helper.cursor("wallet", cursor => {
            if( ! cursor) return false
            var wallet = cursor.value
            // Convert anything other than a string or number back into its proper type
            wallet.created = new Date(wallet.created)
            wallet.last_modified = new Date(wallet.last_modified)
            wallet.backup_date = wallet.backup_date ? new Date(wallet.backup_date):null
            wallet.brainkey_backup_date = wallet.brainkey_backup_date ? new Date(wallet.brainkey_backup_date):null
            try { WalletTcomb(wallet) } catch(e) {
                console.log("WalletDb format error", e); }
            wallet.wallet_object = wallet
            this.setState({ wallet })
            return false //stop iterating
        });
    }
    
}

export var WalletDbWrapped = alt.createStore(WalletDb, "WalletDb");
export default WalletDbWrapped

function reject(error) {
    console.error( "----- WalletDb reject error -----", error)
    throw new Error(error)
}
