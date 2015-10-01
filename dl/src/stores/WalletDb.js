import iDB from "idb-instance";
import Apis from "rpc_api/ApiInstances"
import key from "common/key_utils";
import idb_helper from "idb-helper";
import _ from "lodash";
import Immutable from "immutable";

import PrivateKeyStore from "stores/PrivateKeyStore"
import {WalletTcomb, PrivateKeyTcomb} from "./tcomb_structs";
import PrivateKey from "ecc/key_private"
import TransactionConfirmActions from "actions/TransactionConfirmActions"
import WalletUnlockActions from "actions/WalletUnlockActions"
import PrivateKeyActions from "actions/PrivateKeyActions"
import chain_config from "chain/config"

//TODO delete wallet_public_name, this is managed in WalletManagerStore
var wallet_public_name = "default"

var aes_private_map = {}
var transaction

var TRACE = false

/** Represents a single wallet and related indexedDb database operations. */
class WalletDb {
    
    constructor() {
        this.wallet = Immutable.Map();
        // Confirm only works when there is a UI
        this.confirm_transactions = true
    }
    
    getWallet() {
        return this.wallet.get(wallet_public_name)
    }
    
    getCurrentWalletName() {
        return wallet_public_name
    }
    
    /** for unit testing */
    setCurrentWalletName(public_name) {
        wallet_public_name = public_name
    }
    
    onLock() {
        delete aes_private_map[wallet_public_name]
    }
    
    isLocked() {
        return aes_private_map[wallet_public_name] ? false : true
    }
    
    //rename to decryptTcomb_PrivateKey
    decryptTcomb_PrivateKey(private_key_tcomb) {
        if( ! private_key_tcomb) return null
        var aes_private = aes_private_map[ wallet_public_name ] 
        if ( ! aes_private)
            throw new Error("wallet locked " + wallet_public_name)
        var private_key_hex = aes_private.decryptHex(
                private_key_tcomb.encrypted_key)
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
    
    // todo -> wallet actions
    process_transaction(tr, signer_pubkeys, broadcast) {
        if(Apis.instance().chain_id !== this.getWallet().chain_id)
            return Promise.reject("Mismatched chain_id; expecting " +
                this.getWallet().chain_id + ", but got " +
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
            ["wallet", "private_keys", "balance_claims"], "readwrite"
        )
        return transaction
    }
    
    getBrainKey() {
        var wallet = this.wallet.get(wallet_public_name)
        var aes_private = aes_private_map[wallet_public_name]
        if ( ! aes_private) throw new Error("wallet locked " + wallet_public_name)
        if ( ! wallet.encrypted_brainkey) throw new Error("missing brainkey")
        var brainkey_plaintext = aes_private.decryptHexToText( wallet.encrypted_brainkey )
        return brainkey_plaintext
    }
    
    getBrainKeyPrivate(brainkey_plaintext = this.getBrainKey()) {
        if( ! brainkey_plaintext) throw new Error("Missing brainkey")
        return PrivateKey.fromSeed( key.normalize_brain_key(brainkey_plaintext) )
    }
    
    onCreateWallet(
        password_plaintext,
        brainkey_plaintext,
        unlock = false
    ) {
        return new Promise( (resolve, reject) => {
            if(this.wallet.get(wallet_public_name)) {
                reject("wallet exists")
                return
            }
            if( typeof password_plaintext !== 'string')
                throw new Error("password string is required")
            
            var password_aes = Aes.fromSeed( password_plaintext )
            
            var encryption_buffer = key.get_random_key().toBuffer()
            // encryption_key is the global encryption key (does not change even if the passsword changes)
            var encryption_key = password_aes.encryptToHex( encryption_buffer )
            // aes_private is the global aes encrypt / decrypt object
            var aes_private = Aes.fromSeed( encryption_buffer )
            
            if( ! brainkey_plaintext)
                brainkey_plaintext = key.suggest_brain_key()
            else
                brainkey_plaintext = key.normalize_brain_key(brainkey_plaintext)
            var brainkey_private = this.getBrainKeyPrivate( brainkey_plaintext )
            var brainkey_pubkey = brainkey_private.toPublicKey().toPublicKeyString()
            var encrypted_brainkey = aes_private.encryptToHex( brainkey_plaintext )
            
            var password_private = PrivateKey.fromSeed( password_plaintext )
            var password_pubkey = password_private.toPublicKey().toPublicKeyString()
            
            let wallet = {
                public_name: wallet_public_name,
                password_pubkey,
                encryption_key,
                encrypted_brainkey,
                brainkey_pubkey,
                brainkey_sequence: 0,
                created: new Date(),
                last_modified: new Date(),
                chain_id: Apis.instance().chain_id
            }
            WalletTcomb(wallet)
            var transaction = this.transaction_update()
            var add = idb_helper.add( transaction.objectStore("wallet"), wallet )
            var end = idb_helper.on_transaction_end(transaction).then( () => {
                this.wallet = this.wallet.set(
                    wallet_public_name,
                    wallet//WalletTcomb(wallet)
                )
                if(unlock) aes_private_map[wallet_public_name] = aes_private
            })
            resolve( Promise.all([ add, end ]) )
        })
    }
    
    /** This also serves as 'unlock' */
    validatePassword( password, unlock = false ) {
        var wallet = this.wallet.get(wallet_public_name)
        try {
            var password_private = PrivateKey.fromSeed( password )
            var password_pubkey = password_private.toPublicKey().toPublicKeyString()
            if(wallet.password_pubkey !== password_pubkey) return false
            if( unlock ) {
                var password_aes = Aes.fromSeed( password )
                var encryption_plainbuffer = password_aes.decryptHexToBuffer( wallet.encryption_key )
                var aes_private = Aes.fromSeed( encryption_plainbuffer )
                aes_private_map[wallet_public_name] = aes_private
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
            var wallet = this.wallet.get(wallet_public_name)
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
                var aes_private = Aes.fromSeed( encryption_plainbuffer )
                aes_private_map[wallet_public_name] = aes_private
            } else {
                // new password, make sure the wallet gets locked
                delete aes_private_map[wallet_public_name]
            }
            resolve( this.setWalletModified() )
        })
    }
    
    /** @return { private_key, sequence } */
    generateNextKey() {
        var brainkey = this.getBrainKey()
        if( ! brainkey) throw new Error("missing brainkey")
        var wallet = this.wallet.get(wallet_public_name)
        var sequence = wallet.brainkey_sequence
        var private_key = key.get_brainkey_private( brainkey, sequence )
        this.incrementBrainKeySequence()
        return { private_key, sequence }
    }
    
    incrementBrainKeySequence( transaction ) {
        var wallet = this.wallet.get(wallet_public_name)
        wallet.brainkey_sequence ++
        return this._updateWallet( transaction )
    }
    
    /** WIF format
    */
    importKeys(private_key_objs) {
        if(TRACE) console.log('... WalletDb.importKeys START')
        return WalletUnlockActions.unlock().then( () => {
            var transaction = this.transaction_update_keys()
            var promises = []
            var import_count = 0, duplicate_count = 0
            if(TRACE) console.log('... importKeys save key loop start')
            for(let private_key_obj of private_key_objs) {
                
                var wif = private_key_obj.wif || private_key_obj
                if( ! wif) {
                    console.log("ERROR WalletDb importKeys, key object missing WIF")
                    continue
                }
                var private_key = PrivateKey.fromWif(wif)
                promises.push(
                    this.saveKey(
                        private_key,
                        private_key_obj.import_account_names,
                        null,//brainkey_pos
                        transaction,
                        private_key_obj.public_key_string
                    ).then(
                        ret => {
                            if(ret.result == "duplicate") {
                                duplicate_count++
                            } else if(ret.result == "added") {
                                import_count++
                            } else
                                throw new Error('unknown return',ret)
                            return ret.id
                        }
                    )
                )
            }
            if(TRACE) console.log('... importKeys save key loop done')
            return this.setWalletModified(transaction).then( ()=> {
                return Promise.all(promises).catch( error => {
                    //DEBUG
                    console.log('importKeys transaction.abort', error)    
                    throw error
                }).then( private_key_ids => {
                    if(TRACE) console.log('... WalletDb.importKeys done')
                    return {import_count, duplicate_count, private_key_ids}
                })
            })
        })
    }
    
    saveKeys(private_keys, transaction, public_key_string) {
        var promises = []
        for(let private_key_record of private_keys) {
            promises.push( this.saveKey(
                private_key_record.private_key,
                null, //import_account_names
                private_key_record.sequence,
                transaction,
                public_key_string
            ))
        }
        return Promise.all(promises)
    }
    
    saveKey(
        private_key,
        import_account_names,
        brainkey_pos,
        transaction,
        public_key_string
    ) {
        var password_aes_private = aes_private_map[ wallet_public_name ]
        var private_cipherhex = password_aes_private.encryptToHex( private_key.toBuffer() )
        var wallet = this.getWallet()
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
            brainkey_pos
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
    
    /** This method can not unlock the wallet.  Unlocking a wallet is
    not compatible with transactions. */
    _updateWallet(transaction = this.transaction_update()) {
        var wallet = this.wallet.get(wallet_public_name)
        if ( ! wallet) {
            reject("missing wallet " + wallet_public_name)
            return
        }
        //DEBUG console.log('... wallet',wallet)
        var wallet_clone = _.cloneDeep( wallet )
        wallet_clone.last_modified = new Date()
        // if(update_callback)
        //     update_callback(wallet_clone)
        
        WalletTcomb(wallet_clone) // validate
        //TypeError: Invalid argument `value` = `2015-07-14T14:49:59.417Z` supplied to irreducible type `Dat`
        
        var wallet_store = transaction.objectStore("wallet")
        var p = idb_helper.on_request_end( wallet_store.put(wallet_clone) )
        var p2 = idb_helper.on_transaction_end( transaction  ).then( () =>
            this.wallet = this.wallet.set( wallet_public_name, wallet_clone ) )
        return Promise.all([p,p2])
    }

    /** This method may be called again should the main database change */
    loadDbData() {
        var map = Immutable.Map().asMutable()
        return idb_helper.cursor("wallet", cursor => {
            if( ! cursor) {
                this.wallet = map.asImmutable()
                return
            }
            var wallet = cursor.value//WalletTcomb(cursor.value)
            map.set(wallet_public_name, wallet)
            cursor.continue()
        });
    }
    
}

module.exports = new WalletDb()

function reject(error) {
    console.error( "----- WalletDb reject error -----", error)
    throw new Error(error)
}