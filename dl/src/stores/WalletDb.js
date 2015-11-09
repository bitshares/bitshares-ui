import alt from "alt-instance"
import BaseStore from "stores/BaseStore"

import iDB from "idb-instance";
import Apis from "rpc_api/ApiInstances"
import key from "common/key_utils";
import idb_helper from "idb-helper";
import _ from "lodash";

import PrivateKeyStore from "stores/PrivateKeyStore"
import {WalletTcomb, PrivateKeyTcomb} from "./tcomb_structs";
import PrivateKey from "ecc/key_private"
import TransactionConfirmActions from "actions/TransactionConfirmActions"
import WalletUnlockActions from "actions/WalletUnlockActions"
import PrivateKeyActions from "actions/PrivateKeyActions"
import chain_config from "chain/config"
import ChainStore from "api/ChainStore"
import AddressIndex from "stores/AddressIndex"

var aes_private
var transaction

var TRACE = false

/** Represents a single wallet and related indexedDb database operations. */
class WalletDb extends BaseStore {
    
    constructor() {
        super()
        this.state = { wallet: null, saving_keys: false }
        // Confirm only works when there is a UI (this is for mocha unit tests)
        this.confirm_transactions = true
        ChainStore.subscribe(this.checkNextGeneratedKey.bind(this))
        this.generateNextKey_pubcache = []
        // WalletDb use to be a plan old javascript class (not an Alt store) so
        // for now many methods need to be exported...
        this._export(
            "checkNextGeneratedKey","getWallet","onLock","isLocked","decryptTcomb_PrivateKey","getPrivateKey","process_transaction","transaction_update","transaction_update_keys","getBrainKey","getBrainKeyPrivate","onCreateWallet","validatePassword","changePassword","generateNextKey","incrementBrainKeySequence","saveKeys","saveKey","setWalletModified","setBackupDate","setBrainkeyBackupDate","_updateWallet","loadDbData",
            "importKeysWorker"
        )
    }
    
    /** Discover derived keys that are not in this wallet */
    checkNextGeneratedKey() {
        if( ! this.state.wallet) return
        if( ! aes_private) return // locked
        if( ! this.state.wallet.encrypted_brainkey) return // no brainkey
        if(this.chainstore_account_ids_by_key === ChainStore.account_ids_by_key)
            return // no change
        this.chainstore_account_ids_by_key = ChainStore.account_ids_by_key
        // Helps to ensure we are looking at an un-used key
        // Adversly affected by https://github.com/cryptonomex/graphene/issues/324
        try { this.generateNextKey( false /*save*/ ) } catch(e) {
            console.error(e) }
    }
    
    getWallet() {
        return this.state.wallet
    }
    
    onLock() {
        aes_private = null
    }
    
    isLocked() {
        return aes_private ? false : true
    }
    
    decryptTcomb_PrivateKey(private_key_tcomb) {
        if( ! private_key_tcomb) return null
        if( ! aes_private) throw new Error("wallet locked")
        var private_key_hex = aes_private.decryptHex(private_key_tcomb.encrypted_key)
        return PrivateKey.fromBuffer(new Buffer(private_key_hex, 'hex'))
    }
    
    /** @return ecc/PrivateKey or null */
    getPrivateKey(public_key) {
        if(! public_key) return null
        if(public_key.Q) public_key = public_key.toPublicKeyString()
        var private_key_tcomb = PrivateKeyStore.getTcomb_byPubkey(public_key)
        if(! private_key_tcomb) return null
        return this.decryptTcomb_PrivateKey(private_key_tcomb)
    }
    
    process_transaction(tr, signer_pubkeys, broadcast) {
        if(Apis.instance().chain_id !== this.state.wallet.chain_id)
            return Promise.reject("Mismatched chain_id; expecting " +
                this.state.wallet.chain_id + ", but got " +
                Apis.instance().chain_id)
        
        return WalletUnlockActions.unlock().then( () => {
            return tr.set_required_fees().then(()=> {
                var signer_pubkeys_added = {}
                if(signer_pubkeys) {
                    // Balance claims are by address, only the private
                    // key holder can know about these additional
                    // potential keys.
                    var pubkeys = PrivateKeyStore.getPubkeys_having_PrivateKey(signer_pubkeys)
                    if( ! pubkeys.length)
                        throw new Error("Missing signing key")

                    for(let pubkey_string of pubkeys) {
                        var private_key = this.getPrivateKey(pubkey_string)
                        tr.add_signer(private_key, pubkey_string)
                        signer_pubkeys_added[pubkey_string] = true
                    }
                }

                return tr.get_potential_signatures().then( ({pubkeys, addys})=> {
                    var my_pubkeys = PrivateKeyStore.getPubkeys_having_PrivateKey(pubkeys, addys)

                    //{//Testing only, don't send All public keys!
                    //    var pubkeys_all = PrivateKeyStore.getPubkeys() // All public keys
                    //    tr.get_required_signatures(pubkeys_all).then( required_pubkey_strings =>
                    //        console.log('get_required_signatures all\t',required_pubkey_strings.sort(), pubkeys_all))
                    //    tr.get_required_signatures(my_pubkeys).then( required_pubkey_strings =>
                    //        console.log('get_required_signatures normal\t',required_pubkey_strings.sort(), pubkeys))
                    //}

                    return tr.get_required_signatures(my_pubkeys).then( required_pubkeys => {
                        for(let pubkey_string of required_pubkeys) {
                            if(signer_pubkeys_added[pubkey_string]) continue
                            var private_key = this.getPrivateKey(pubkey_string)
                            if( ! private_key)
                                // This should not happen, get_required_signatures will only
                                // returned keys from my_pubkeys
                                throw new Error("Missing signing key for " + pubkey_string)
                            tr.add_signer(private_key, pubkey_string)
                        }
                    })
                }).then(()=> {
                    if(broadcast) {
                        if(this.confirm_transactions) {
                            TransactionConfirmActions.confirm(tr)
                            return Promise.resolve();
                        }
                        else
                            return tr.broadcast()
                        
                    } else
                        return tr.serialize()
                })
            })
        })
    }
    
    transaction_update() {
        var transaction = iDB.instance().db().transaction(
            ["wallet"], "readwrite"
        )
        return transaction
    }
    
    transaction_update_keys() {
        var transaction = iDB.instance().db().transaction(
            ["wallet", "private_keys"], "readwrite"
        )
        return transaction
    }
    
    getBrainKey() {
        var wallet = this.state.wallet
        if ( ! wallet.encrypted_brainkey) throw new Error("missing brainkey")
        if ( ! aes_private) throw new Error("wallet locked")
        var brainkey_plaintext = aes_private.decryptHexToText( wallet.encrypted_brainkey )
        return brainkey_plaintext
    }
    
    getBrainKeyPrivate(brainkey_plaintext = this.getBrainKey()) {
        if( ! brainkey_plaintext) throw new Error("missing brainkey")
        return PrivateKey.fromSeed( key.normalize_brain_key(brainkey_plaintext) )
    }
    
    onCreateWallet(
        password_plaintext,
        brainkey_plaintext,
        unlock = false,
        public_name = "default"
    ) {
        return new Promise( (resolve, reject) => {
            if( typeof password_plaintext !== 'string')
                throw new Error("password string is required")
            
            var brainkey_backup_date
            if(brainkey_plaintext) {
                if(typeof brainkey_plaintext !== "string")
                    throw new Error("Brainkey must be a string")
                
                if(brainkey_plaintext.trim() === "")
                    throw new Error("Brainkey can not be an empty string")
            
                if(brainkey_plaintext.length < 50)
                    throw new Error("Brainkey must be at least 50 characters long")

                // The user just provided the Brainkey so this avoids
                // bugging them to back it up again.
                brainkey_backup_date = new Date()
            }
            var password_aes = Aes.fromSeed( password_plaintext )
            
            var encryption_buffer = key.get_random_key().toBuffer()
            // encryption_key is the global encryption key (does not change even if the passsword changes)
            var encryption_key = password_aes.encryptToHex( encryption_buffer )
            // If unlocking, local_aes_private will become the global aes_private object
            var local_aes_private = Aes.fromSeed( encryption_buffer )
            
            if( ! brainkey_plaintext)
                brainkey_plaintext = key.suggest_brain_key()
            else
                brainkey_plaintext = key.normalize_brain_key(brainkey_plaintext)
            var brainkey_private = this.getBrainKeyPrivate( brainkey_plaintext )
            var brainkey_pubkey = brainkey_private.toPublicKey().toPublicKeyString()
            var encrypted_brainkey = local_aes_private.encryptToHex( brainkey_plaintext )
            
            var password_private = PrivateKey.fromSeed( password_plaintext )
            var password_pubkey = password_private.toPublicKey().toPublicKeyString()
            
            let wallet = {
                public_name,
                password_pubkey,
                encryption_key,
                encrypted_brainkey,
                brainkey_pubkey,
                brainkey_sequence: 0,
                brainkey_backup_date,
                created: new Date(),
                last_modified: new Date(),
                chain_id: Apis.instance().chain_id
            }
            WalletTcomb(wallet) // validation
            var transaction = this.transaction_update()
            var add = idb_helper.add( transaction.objectStore("wallet"), wallet )
            var end = idb_helper.on_transaction_end(transaction).then( () => {
                this.state.wallet = wallet
                this.setState({ wallet })
                if(unlock) aes_private = local_aes_private
            })
            resolve( Promise.all([ add, end ]) )
        })
    }
    
    /** This also serves as 'unlock' */
    validatePassword( password, unlock = false ) {
        var wallet = this.state.wallet
        try {
            var password_private = PrivateKey.fromSeed( password )
            var password_pubkey = password_private.toPublicKey().toPublicKeyString()
            if(wallet.password_pubkey !== password_pubkey) return false
            if( unlock ) {
                var password_aes = Aes.fromSeed( password )
                var encryption_plainbuffer = password_aes.decryptHexToBuffer( wallet.encryption_key )
                aes_private = Aes.fromSeed( encryption_plainbuffer )
                this.checkNextGeneratedKey()
            }                 
            return true
        } catch(e) {
            console.error(e)
            return false
        }
    }
    
    /** This may lock the wallet unless <b>unlock</b> is used. */
    changePassword( old_password, new_password, unlock = false ) {
        return new Promise( resolve => {
            var wallet = this.state.wallet
            if( ! this.validatePassword( old_password ))
                throw new Error("wrong password")
            
            var old_password_aes = Aes.fromSeed( old_password )
            var new_password_aes = Aes.fromSeed( new_password )
            
            if( ! wallet.encryption_key)
                // This change pre-dates the live chain..
                throw new Error("This wallet does not support the change password feature.")
            var encryption_plainbuffer = old_password_aes.decryptHexToBuffer( wallet.encryption_key )
            wallet.encryption_key = new_password_aes.encryptToHex( encryption_plainbuffer )
            
            var new_password_private = PrivateKey.fromSeed( new_password )
            wallet.password_pubkey = new_password_private.toPublicKey().toPublicKeyString()
            
            if( unlock ) {
                aes_private = Aes.fromSeed( encryption_plainbuffer )
            } else {
                // new password, make sure the wallet gets locked
                aes_private = null
            }
            resolve( this.setWalletModified() )
        })
    }
    
    /** @throws "missing brainkey", "wallet locked"
        @return { private_key, sequence }
    */
    generateNextKey(save = true) {
        var brainkey = this.getBrainKey()
        var wallet = this.state.wallet
        var sequence = wallet.brainkey_sequence
        var used_sequence = null
        // Skip ahead in the sequence if any keys are found in use
        for (var i = sequence; i < sequence + 10; i++) {
            var private_key = key.get_brainkey_private( brainkey, i )
            var pubkey =
                this.generateNextKey_pubcache[i] ?
                this.generateNextKey_pubcache[i] :
                this.generateNextKey_pubcache[i] =
                private_key.toPublicKey().toPublicKeyString()
            
            var next_key = ChainStore.getAccountRefsOfKey( pubkey )
            // TODO if ( next_key === undefined ) return undefined
            if(next_key && next_key.size) {
                used_sequence = i
                console.log("WARN: Private key sequence " + used_sequence + " in-use. " + 
                    "I am saving the private key and will go onto the next one.")
                this.saveKey( private_key, used_sequence )
            }
        }
        if(used_sequence !== null) {
            wallet.brainkey_sequence = used_sequence + 1
            this._updateWallet()
        }
        sequence = wallet.brainkey_sequence
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
        var wallet = this.state.wallet
        // increment in RAM so this can't be out-of-sync
        wallet.brainkey_sequence ++
        // update last modified
        return this._updateWallet( transaction )
        //TODO .error( error => ErrorStore.onAdd( "wallet", "incrementBrainKeySequence", error ))
    }
    
    importKeysWorker(private_key_objs) {
        return new Promise( (resolve, reject) => {
            var pubkeys = []
            for(let private_key_obj of private_key_objs)
                pubkeys.push( private_key_obj.public_key_string )
            var addyIndexPromise = AddressIndex.addAll(pubkeys)
            
            var private_plainhex_array = []
            for(let private_key_obj of private_key_objs)
                private_plainhex_array.push( private_key_obj.private_plainhex )
            var AesWorker = require("worker!workers/AesWorker")
            var worker = new AesWorker
            worker.postMessage({
                private_plainhex_array,
                key: aes_private.key, iv: aes_private.iv
            })
            var _this = this
            this.setState({ saving_keys: true })
            worker.onmessage = event => { try {
                console.log("Preparing for private keys save");
                var private_cipherhex_array = event.data
                var enc_private_key_objs = []
                for(let i = 0; i < private_key_objs.length; i++) {
                    var private_key_obj = private_key_objs[i]
                    var {import_account_names, public_key_string, private_plainhex} = private_key_obj
                    var private_cipherhex = private_cipherhex_array[i]
                    if( ! public_key_string) {
                        // console.log('WARN: public key was not provided, this will incur slow performance')
                        var private_key = PrivateKey.fromHex(private_plainhex)
                        var public_key = private_key.toPublicKey() // S L O W
                        public_key_string = public_key.toPublicKeyString()
                    } else
                        if(public_key_string.indexOf(chain_config.address_prefix) != 0)
                            throw new Error("Public Key should start with " + chain_config.address_prefix)
                    
                    var private_key_object = {
                        import_account_names,
                        encrypted_key: private_cipherhex,
                        pubkey: public_key_string
                        // null brainkey_sequence
                    }
                    enc_private_key_objs.push(private_key_object)
                }
                console.log("Saving private keys", new Date().toString());
                var transaction = _this.transaction_update_keys()
                var insertKeysPromise = idb_helper.on_transaction_end(transaction)
                try {
                    var duplicate_count = PrivateKeyStore
                        .addPrivateKeys_noindex(enc_private_key_objs, transaction )
                    if( private_key_objs.length != duplicate_count )
                        _this.setWalletModified(transaction)
                    _this.setState({saving_keys: false})
                    resolve(Promise.all([ insertKeysPromise, addyIndexPromise ]).then( ()=> {
                        console.log("Done saving keys", new Date().toString())
                        // return { duplicate_count }
                    }))
                } catch(e) {
                    transaction.abort()
                    console.error(e)
                    reject(e)
                }
            } catch( e ) { console.error('AesWorker.encrypt', e) }}
        })
    }
    
    saveKeys(private_keys, transaction, public_key_string) {
        var promises = []
        for(let private_key_record of private_keys) {
            promises.push( this.saveKey(
                private_key_record.private_key,
                private_key_record.sequence,
                null, //import_account_names
                public_key_string,
                transaction
            ))
        }
        return Promise.all(promises)
    }
    
    saveKey(
        private_key,
        brainkey_sequence,
        import_account_names,
        public_key_string,
        transaction = this.transaction_update_keys()
    ) {
        var private_cipherhex = aes_private.encryptToHex( private_key.toBuffer() )
        var wallet = this.state.wallet
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
            private_key_object, transaction
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
        var wallet = this.state.wallet
        wallet.backup_date = new Date()
        return this._updateWallet()
    }
    
    setBrainkeyBackupDate() {
        var wallet = this.state.wallet
        wallet.brainkey_backup_date = new Date()
        return this._updateWallet()
    }
    
    /** Saves wallet object to disk.  Always updates the last_modified date. */
    _updateWallet(transaction = this.transaction_update()) {
        var wallet = this.state.wallet
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
            this.state.wallet = wallet_clone
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
            this.state.wallet = wallet
            this.setState({ wallet })
            return false //stop iterating
        });
    }
    
}

export var WalletDbWrapped = alt.createStore(WalletDb, "WalletDb");
module.exports = WalletDbWrapped

function reject(error) {
    console.error( "----- WalletDb reject error -----", error)
    throw new Error(error)
}
