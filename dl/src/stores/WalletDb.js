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
import key_utils from "common/key_utils"

var wallet_public_name = "default"
var aes_private_map = {}
var transaction

var TRACE = false

class WalletDb {
    
    constructor() {
        this.secret_server_token = "secret_server_token";
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
    
    setCurrentWalletName(public_name) {
        wallet_public_name = public_name
    }
    
    getBrainKey() {
        var wallet = this.wallet.get(wallet_public_name)
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
        var wallet = this.wallet.get(wallet_public_name)
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
        if(public_key.Q) public_key = public_key.toPublicKeyString()
        var private_key_tcomb =
            PrivateKeyStore.getTcomb_byPubkey(public_key)
        
        if(! private_key_tcomb)
            return null
        
        return this.decryptTcomb_PrivateKey(private_key_tcomb)
    }
    
    process_transaction(tr, signer_pubkeys, broadcast) {
        if(Apis.instance().chain_id !== this.getWallet().chain_id)
            return Promise.reject("Mismatched chain_id; expecting " +
                this.getWallet().chain_id + ", but got " +
                Apis.instance().chain_id)
        
        return WalletUnlockActions.unlock().then( () => {
            return tr.set_required_fees().then(()=> {
                return tr.finalize().then(()=> {
                    
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
                            //public_keys.push(public_key_string)
                            tr.add_signer(private_key, pubkey_string)
                            signer_pubkeys_added[pubkey_string] = true
                        }
                    }
                    
                    return tr.get_potential_signatures().then( public_keys => {
                        var pubkeys = PrivateKeyStore.getPubkeys_having_PrivateKey(public_keys)
                        if( ! pubkeys.length)
                            throw new Error("Missing signing key")
                        
                        //{//Testing only, don't send All public keys!
                        //    var pubkeys_all = PrivateKeyStore.getPubkeys()
                        //    tr.get_required_signatures(pubkeys_all).then( required_pubkey_strings =>
                        //        console.log('get_required_signatures all\t',required_pubkey_strings.sort(), pubkeys_all))
                        //    tr.get_required_signatures(pubkeys).then( required_pubkey_strings =>
                        //        console.log('get_required_signatures normal\t',required_pubkey_strings.sort(), pubkeys))
                        //}
                        
                        return tr.get_required_signatures(pubkeys).then(
                            required_pubkeys => {
                            //DEBUG console.log('get_required_signatures actual\t',required_pubkeys.sort())
                            for(let pubkey_string of required_pubkeys) {
                                if(signer_pubkeys_added[pubkey_string]) continue
                                var private_key = this.getPrivateKey(pubkey_string)
                                if( ! private_key)
                                    throw new Error("Missing signing key for " + pubkey_string)
                                tr.add_signer(private_key, pubkey_string)
                            }
                            //DEBUG console.log('... pubkey_strings',pubkey_strings,tr.serialize())
                        })
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
    
    onCreateWallet(
        login_account_name,
        password_plaintext,
        brainkey_plaintext,
        unlock = false
    ) {
        return new Promise( (resolve, reject) => {
            if(this.wallet.get(wallet_public_name)) {
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
            
            // Create a public key used to encrypt backups
            
            // "\tbackup_pubkey" is being appended to provide a separation
            // between the backup recovery private key and the brainkey
            // ... In other words, a backup can be decrypted by either a 
            // backup recovery key or the brain key.  Someone with the 
            // private backup recovery key can not access private keys to
            // accounts derived from the brainkey.
            var backup_private_key = PrivateKey.fromSeed(
                key_utils.normalize_brain_key(brainkey_plaintext) +
                "\tbackup_pubkey"
            )
            var backup_pubkey = backup_private_key.toPublicKey().toPublicKeyString()
            
            let wallet = {
                public_name: wallet_public_name,
                login_account_name,
                password_checksum: password.checksum,
                encrypted_brainkey: brainkey_cipherhex,
                brainkey_checksum,
                backup_pubkey,
                created: new Date(),
                last_modified: new Date(),
                chain_id: Apis.instance().chain_id
            }
            WalletTcomb(wallet)
            var transaction = this.transaction_update()
            var add = idb_helper.add(
                transaction.objectStore("wallet"),
                wallet
            )
            var end = idb_helper.on_transaction_end(transaction).then( () => {
                this.wallet = this.wallet.set(
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
        var wallet = this.wallet.get(wallet_public_name)
        if( ! wallet)
            throw new Error("missing wallet " + wallet_public_name)
        
        var brainkey = this.getBrainKey()
        if( ! brainkey)
            throw new Error("missing brainkey")
        
        var owner_privkey = key.get_random_key()
        var active_privkey = key.get_active_private(owner_privkey)

        return [
            {
                private_key: owner_privkey
            },{
                private_key: active_privkey
            }
        ]
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
                        private_key_obj.import_balances,
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
            BalanceClaimActions.refreshBalanceClaims()
            BalanceClaimActions.loadMyAccounts()
            if(TRACE) console.log('... importKeys setWalletModified')
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
        //private_keys = [{private_key}]
        var promises = []
        for(let private_key_record of private_keys) {
            promises.push( this.saveKey(
                private_key_record.private_key,
                null, //import_account_names
                null, //import_balances
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
            // console.log('WARN: public key was not provided, this may incur slow performance')
            var public_key = private_key.toPublicKey()
            public_key_string = public_key.toPublicKeyString()
        } else 
            if(public_key_string.indexOf(chain_config.address_prefix) != 0)
                throw new Error("Public Key should start with " + chain_config.address_prefix)
        
        var private_key_object = {
            import_account_names,
            encrypted_key: private_cipherhex,
            pubkey: public_key_string
        }
        
        var p1 = PrivateKeyStore.onAddKey(
            private_key_object, transaction
        ).then((ret)=> {
            if(TRACE) console.log('... WalletDb.saveKey result',ret.result)
            return ret
        })
        
        var p2
        if( ! import_balances)
            p2 = Promise.resolve()
        else {
            if(TRACE) console.log('... WalletDb saveKey import_balances')
            var ps = []
            for(let chain_balance_record of import_balances) {
                var p = BalanceClaimActions.add({
                    balance_claim: {
                        chain_balance_record,
                        pubkey: public_key_string,
                    }, transaction
                })
                ps.push(p)
            }
            p2 = Promise.all(ps)
        }
        
        return p2.then(()=>p1)//save the results from p1
    }
    
    setWalletModified(transaction) {
        return this._updateWallet( transaction )
    }
    
    /** This method can not unlock the wallet.  Unlocking a wallet is
    not compatible with transactions. */
    _updateWallet(transaction, update_callback) {
        var wallet = this.wallet.get(wallet_public_name)
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
        
        var wallet_store = transaction.objectStore("wallet")
        var p = idb_helper.on_request_end(
            wallet_store.put(wallet_clone)
        )
        var p2 = idb_helper.on_transaction_end( transaction  ).then(
            () => {
                // Update RAM
                this.wallet.set( wallet_clone.public_name, wallet_clone )
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
        var map = this.wallet.asMutable()
        return idb_helper.cursor("wallet", cursor => {
            if( ! cursor) {
                this.wallet = map.asImmutable()
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

