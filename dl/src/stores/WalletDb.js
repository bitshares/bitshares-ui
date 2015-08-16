import iDB from "idb-instance";
import Apis from "rpc_api/ApiInstances"
import key from "common/key_utils"
import idb_helper from "idb-helper"
import cloneDeep from "lodash.clonedeep"
import Immutable from "immutable";

import PrivateKeyStore from "stores/PrivateKeyStore"
import BalanceClaimActions from "actions/BalanceClaimActions"
import {WalletTcomb, PrivateKeyTcomb} from "./tcomb_structs";
import PrivateKey from "ecc/key_private"
import TransactionConfirmActions from "actions/TransactionConfirmActions"
import WalletUnlockActions from "actions/WalletUnlockActions"
import chain_config from "chain/config"

var wallet_public_name = "default"
var aes_private_map = {}
var transaction

var TRACE = true

class WalletDb {
    
    constructor() {
        this.secret_server_token = "secret_server_token";
        this.wallets = Immutable.Map();
        // Confirm only works when there is a UI
        this.confirm_transactions = true
    }
    
    getWallet() {
        return this.wallets.get(wallet_public_name)
    }
    
    getCurrentWalletName() {
        return wallet_public_name
    }
    
    setCurrentWalletName(public_name) {
        wallet_public_name = public_name
    }
    
    getBrainKey() {
        var wallet = this.wallets.get(wallet_public_name)
        if ( ! wallet)
            throw new Error("missing wallet " + wallet_public_name)
        
        var aes_private = aes_private_map[wallet_public_name]
        if ( ! aes_private)
            throw new Error("wallet locked " + wallet_public_name)
        
        if ( ! wallet.encrypted_brainkey)
            throw new Error("missing brainkey")
        
        var brainkey_plaintext = aes_private.decryptHexToText(
            wallet.encrypted_brainkey
        )
        try {
            key.aes_private(
                brainkey_plaintext + this.secret_server_token,
                wallet.brainkey_checksum
            )
        } catch(e) {
            throw new Error('Brainkey checksum mis-match')
        }
        return brainkey_plaintext
    }
    
    onLock() {
        delete aes_private_map[wallet_public_name]
    }
    
    isLocked() {
        return aes_private_map[wallet_public_name] ? false : true
    }
    
    validatePassword( password, unlock = false ) {
        var wallet = this.wallets.get(wallet_public_name)
        if ( ! wallet)
            return false
        
        try {
            var aes_private = key.aes_private(
                password + this.secret_server_token,
                wallet.password_checksum
            )
            if(unlock) {
                aes_private_map[wallet_public_name] = aes_private
            }
        } catch(e) {
            if(! e.message == 'wrong password')
                console.log(e)
        }
    }
    
    //rename to decryptTcomb_PrivateKey
    decryptTcomb_PrivateKey(private_key_tcomb) {
        if(private_key_tcomb.wallet_id != this.getWallet().id)
            throw new Error("Incorrect wallet")
        if( ! private_key_tcomb)
            return null
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
        if(public_key.Q) public_key = public_key.toBtsPublic()
        var private_key_tcombs =
            PrivateKeyStore.getTcombs_byPubkey(public_key)
        
        if(! private_key_tcombs)
            return null
        
        var wallet_id = this.getWallet().id
        for(let private_key_tcomb of private_key_tcombs)
            if(private_key_tcomb.wallet_id == wallet_id)
                return this.decryptTcomb_PrivateKey(private_key_tcomb)
        
        return null
    }
    
    process_transaction(tr, signer_private_keys, broadcast, sign = true) {
        if(Apis.instance().chain_id !== this.getWallet().chain_id)
            return Promise.reject("Mismatched chain_id; expecting " +
                this.getWallet().chain_id + ", but got " +
                Apis.instance().chain_id)
        
        return WalletUnlockActions.unlock().then( () => {
            return tr.set_required_fees().then(()=> {
                return tr.finalize().then(()=> {
                    
                    if(signer_private_keys) {
                        if( ! Array.isArray(signer_private_keys))
                            signer_private_keys = [ signer_private_keys ]
                        for(let private_key of signer_private_keys)
                            if(sign) tr.sign(private_key)
                    } else {
                        // set<public_key> get_potential_signatures(signed_transaction)
                        var pubkeys = PrivateKeyStore.getPubkeys()
                        //DEBUG console.log('... pubkeys',pubkeys)
                        if( ! pubkeys.length)
                            throw new Error("Missing signing key")
                        return tr.get_required_signatures(pubkeys).then(
                            pubkey_strings => {
                            //DEBUG console.log('... pubkey_strings',pubkey_strings)
                            for(let pubkey_string of pubkey_strings) {
                                var private_key = this.getPrivateKey(pubkey_string)
                                if( ! private_key)
                                    throw new Error("Missing signing key for " + pubkey_string)
                                if(sign) tr.sign(private_key)
                            }
                        })
                    }
                }).then(()=> {
                    if(broadcast) {
                        if(this.confirm_transactions)
                            return TransactionConfirmActions.confirm_and_broadcast(tr)
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
            ["wallets"], "readwrite"
        )
        return transaction
    }
    
    transaction_update_keys() {
        var transaction = iDB.instance().db().transaction(
            ["wallets", "private_keys", "balance_claims"], "readwrite"
        )
        return transaction
    }
    
    onCreateWallet(
        login_account_name,
        password_plaintext,
        brainkey_plaintext,
        unlock = false
    ) {
        return new Promise( (resolve, reject) => {
            if(this.wallets.get(wallet_public_name)) {
                reject("wallet exists")
                return
            }
            
            var password = key.aes_checksum(
                password_plaintext + this.secret_server_token
            )
            
            if( ! brainkey_plaintext) {
                brainkey_plaintext = key.suggest_brain_key(
                    key.browserEntropy() +
                    this.secret_server_token
                )
            }
            
            var {brainkey_checksum, brainkey_cipherhex} =
                this.encrypteBrainKey(password, brainkey_plaintext)
            
            let wallet = {
                public_name: wallet_public_name,
                login_account_name,
                password_checksum: password.checksum,
                encrypted_brainkey: brainkey_cipherhex,
                brainkey_checksum,
                brainkey_sequence: 0,
                created: new Date(),
                last_modified: new Date(),
                chain_id: Apis.instance().chain_id
            }
            WalletTcomb(wallet)
            var transaction = this.transaction_update()
            var add = idb_helper.add(
                transaction.objectStore("wallets"),
                wallet
            )
            var end = idb_helper.on_transaction_end(transaction).then( () => {
                this.wallets = this.wallets.set(
                    wallet.public_name,
                    wallet//WalletTcomb(wallet)
                )
                if(unlock) {
                    aes_private_map[wallet_public_name] =
                        password.aes_private
                }
            })
            resolve( Promise.all([ add, end ]) )
        })
    }
    
    /** @return {brainkey_checksum, brainkey_cipherhex}
    brainkey_checksum used when deleting then re-adding a brainkey
    */
    encrypteBrainKey(password, brainkey_plaintext){
        var brainkey_checksum=null, brainkey_cipherhex=null
        if(brainkey_plaintext) {
            brainkey_checksum = key.aes_checksum(
                brainkey_plaintext + this.secret_server_token
            ).checksum
        
            brainkey_cipherhex = password.aes_private.encryptToHex(
                brainkey_plaintext
            )
        }
        return {brainkey_checksum, brainkey_cipherhex}
    }
    
    generateKeys() {
        var wallet = this.wallets.get(wallet_public_name)
        if( ! wallet)
            throw new Error("missing wallet " + wallet_public_name)
        
        var brainkey = this.getBrainKey()
        if( ! brainkey)
            throw new Error("missing brainkey")
        
        var owner_privkey = key.get_owner_private(
            brainkey, wallet.brainkey_sequence
        )
        var active_privkey = key.get_active_private(owner_privkey)

        return [
            {
                private_key: owner_privkey,
                sequence: wallet.brainkey_sequence + ""
            },{
                private_key: active_privkey,
                sequence: wallet.brainkey_sequence + ".0"
            }
        ]
    }
    
    
    /** WIF format
    */
    importKeys(private_key_objs) {
        if(TRACE) console.log('... WalletDb.importKeys start')
        return WalletUnlockActions.unlock().then( () => {
            var transaction = this.transaction_update_keys()
            var promises = []
            var import_count = 0, duplicate_count = 0
            console.log('... importKeys save key loop')
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
                        private_key_obj.import_balances,
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
            console.log('... importKeys setWalletModified')
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
        //private_keys = [{private_key, sequence}]
        var promises = []
        for(let private_key_record of private_keys) {
            promises.push( this.saveKey(
                private_key_record.private_key,
                null, //import_account_names
                null, //import_balances
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
        import_balances,
        brainkey_pos,
        transaction,
        public_key_string
    ) {
        var password_aes_private = aes_private_map[
            wallet_public_name
        ]
        var private_cipherhex =
            password_aes_private.encryptToHex(
                private_key.toBuffer()
            )
        var wallet = this.getWallet()
        
        if( ! public_key_string) {
            //S L O W
            console.log('WARN: public key was not provided, this may incur slow performance')
            var public_key = private_key.toPublicKey()
            public_key_string = public_key.toBtsPublic()
        } else 
            if(public_key_string.indexOf(chain_config.address_prefix) != 0)
                throw new Error("Public Key should start with " + chain_config.address_prefix)
        
        var private_key_object = {
            wallet_id: wallet.id,
            import_account_names,
            encrypted_key: private_cipherhex,
            brainkey_pos: brainkey_pos,
            pubkey: public_key_string
        }
        return (import_balances, private_key_object) => {
            return PrivateKeyStore.onAddKey(
                private_key_object, transaction,
                event => {
                    if( ! import_balances) return
                    var private_key_id = event.target.result
                    private_key_object.id = private_key_id
                    if(TRACE) console.log('... WalletDb saveKey import_balances private_key_id',private_key_id)
                    var ps = []
                    for(let chain_balance_record of import_balances) {
                        var p = BalanceClaimActions.add({
                            balance_claim: {
                                chain_balance_record,
                                private_key_id
                            }, transaction
                        })
                        ps.push(p)
                    }
                    return Promise.all(ps)//.then( ()=> { return ret })
                }
            ).then((ret)=> {
                if(TRACE) console.log('... WalletDb.saveKey result',ret.result)
                return ret
               
            })
        }(import_balances, private_key_object)//copy var reference for callback
    }
    
    incrementBrainKeySequence(transaction) {
        return this._updateWallet( transaction, wallet => {
            wallet.brainkey_sequence = wallet.brainkey_sequence + 1
        })
    }
    
    setWalletModified(transaction) {
        return this._updateWallet( transaction )
    }
    
    /** This method can not unlock the wallet.  Unlocking a wallet is
    not compatible with transactions. */
    _updateWallet(transaction, update_callback) {
        var wallet = this.wallets.get(wallet_public_name)
        if ( ! wallet) {
            reject("missing wallet " + wallet_public_name)
            return
        }
        //DEBUG console.log('... wallet',wallet)
        var wallet_clone = cloneDeep( wallet )
        wallet_clone.last_modified = new Date()
        if(update_callback)
            update_callback(wallet_clone)
        
        WalletTcomb(wallet_clone)
        //TypeError: Invalid argument `value` = `2015-07-14T14:49:59.417Z` supplied to irreducible type `Dat`
        
        var wallet_store = transaction.objectStore("wallets")
        var p = idb_helper.on_request_end(
            wallet_store.put(wallet_clone)
        )
        var p2 = idb_helper.on_transaction_end( transaction  ).then(
            () => {
                // Update RAM
                this.wallets.set( wallet_clone.public_name, wallet_clone )
            }
        )
        return Promise.all([p,p2])
    }
    
    /*
    validateBrainkey(
        wallet,
        brain_key
    ) {
        if ( ! wallet)
            throw new Error("wrong password")
        
        if(! brain_key || typeof brain_key != 'string')
            throw new Error("required: brain_key")
        
        if(! secret_server_token || typeof password != 'string')
            throw new Error("required: secret_server_token")
        
        if ( ! wallet.brainkey_checksum)
            throw new Error("wrong password")
        
        var aes_private = key.aes_private(
            brain_key + secret_server_token,
            wallet.brainkey_checksum
        )
    }
    */

    loadDbData() {
        var map = this.wallets.asMutable()
        return idb_helper.cursor("wallets", cursor => {
            if( ! cursor) {
                this.wallets = map.asImmutable()
                return
            }
            var wallet = cursor.value//WalletTcomb(cursor.value)
            map.set(wallet.public_name, wallet)
            cursor.continue()
        });
    }
    
}

module.exports = new WalletDb()

function reject(error) {
    console.error( "----- WalletDb reject error -----", error)
    throw new Error(error)
}   

