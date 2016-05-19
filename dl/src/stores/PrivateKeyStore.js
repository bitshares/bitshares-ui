import Immutable from "immutable";
import alt from "../alt-instance";
import BaseStore from "./BaseStore";
import iDB from "../idb-instance";
import idb_helper from "../idb-helper";
import WalletDb from "./WalletDb";

import {PrivateKeyTcomb} from "./tcomb_structs";
import PrivateKeyActions from "actions/PrivateKeyActions"
import CachedPropertyActions from "actions/CachedPropertyActions"
import AddressIndex from "stores/AddressIndex"
import ChainStore from "api/ChainStore"
import PublicKey from "ecc/key_public"
import Address from "ecc/address"

import hash from "common/hash"


/** No need to wait on the promises returned by this store as long as
    this.state.privateKeyStorage_error == false and
    this.state.pending_operation_count == 0 before performing any important
    operations.
*/
class PrivateKeyStore extends BaseStore {
    
    constructor() {
        super()
        this.state = this._getInitialState()
        this.pending_operation_count = 0
        this.bindListeners({
            onLoadDbData: PrivateKeyActions.loadDbData,
            onAddKey: PrivateKeyActions.addKey
        })
        this._export(
            "hasKey",
            "getPubkeys",
            "getTcomb_byPubkey",
            "getPubkeys_having_PrivateKey",
            "addPrivateKeys_noindex",
            "decodeMemo"
        );
    }
    
    _getInitialState() {
        return {
            keys: Immutable.Map(),
            privateKeyStorage_error: false,
            pending_operation_count: 0,
            privateKeyStorage_error_add_key: null,
            privateKeyStorage_error_loading: null
        }
    }
    
    /** This method may be called again should the main database change */
    onLoadDbData(resolve) {//resolve is deprecated
        this.pendingOperation() 
        this.setState(this._getInitialState())
        var keys = Immutable.Map().asMutable()
        var p = idb_helper.cursor("private_keys", cursor => {
            if( ! cursor) {
                this.setState({ keys: keys.asImmutable() })
                return
            }
            var private_key_tcomb = PrivateKeyTcomb(cursor.value)
            keys.set(private_key_tcomb.pubkey, private_key_tcomb)
            AddressIndex.add(private_key_tcomb.pubkey)
            cursor.continue()
        }).then(()=>{
            this.pendingOperationDone()
        }).catch( error => {
            this.setState(this._getInitialState())
            this.privateKeyStorageError('loading', error)
            throw error
        })
        resolve( p )
    }
    
    hasKey(pubkey) {
        return this.state.keys.has(pubkey)
    }
    
    getPubkeys() {
        console.log("getPubkeys", this.state.keys.keySeq().toArray())
        return this.state.keys.keySeq().toArray()
    }
    
    getPubkeys_having_PrivateKey(pubkeys, addys = null) {
        var return_pubkeys = []
        if(pubkeys) {
            for(let pubkey of pubkeys) {
                if(this.hasKey(pubkey)) {
                    return_pubkeys.push(pubkey)
                }
            }
        }
        if(addys) {
            var addresses = AddressIndex.getState().addresses
            for (let addy of addys) {
                var pubkey = addresses.get(addy)
                return_pubkeys.push(pubkey)
            }
        }
        return return_pubkeys
    }
    
    getTcomb_byPubkey(public_key) {
        if(! public_key) return null
        if(public_key.Q)
            public_key = public_key.toPublicKeyString()
        return this.state.keys.get(public_key)
    }
    
    onAddKey({private_key_object, transaction, resolve}) {// resolve is deprecated
        if(this.state.keys.has(private_key_object.pubkey)) {
            resolve({result:"duplicate",id:null})
            return
        }
        
        this.pendingOperation()
        //console.log("... onAddKey private_key_object.pubkey", private_key_object.pubkey)
        
        this.state.keys = this.state.keys.set(
            private_key_object.pubkey,
            PrivateKeyTcomb(private_key_object)
        )
        this.setState({keys: this.state.keys})
        AddressIndex.add(private_key_object.pubkey)
        
        var p = new Promise((resolve, reject) => {
            PrivateKeyTcomb(private_key_object)
            var duplicate = false
            var p = idb_helper.add(
                transaction.objectStore("private_keys"),
                private_key_object
            ).catch( event => {
                // ignore_duplicates
                var error = event.target.error
                console.log('... error',error,event)
                if( error.name != 'ConstraintError' ||
                    error.message.indexOf('by_encrypted_key') == -1
                ) {
                    this.privateKeyStorageError('add_key', error)
                    throw event
                }
                duplicate = true
                event.preventDefault()
            }).then( ()=> {
                this.pendingOperationDone()
                if(duplicate) return {result:"duplicate",id:null}
                if( private_key_object.brainkey_sequence == null)
                    this.binaryBackupRecommended() // non-deterministic
                idb_helper.on_transaction_end(transaction).then(
                    () => { this.setState({ keys: this.state.keys }) } )
                return {
                    result: "added", 
                    id: private_key_object.id
                }
            })
            resolve(p)
        })
        resolve(p)
    }
    
    
    /** WARN: does not update AddressIndex.  This is designed for bulk importing.
        @return duplicate_count
    */
    addPrivateKeys_noindex(private_key_objects, transaction) {
        var store = transaction.objectStore("private_keys")
        var duplicate_count = 0
        var keys = this.state.keys.withMutations( keys => {
            for(let private_key_object of private_key_objects) {
                if(this.state.keys.has(private_key_object.pubkey)) {
                    duplicate_count++
                    continue
                }
                var private_tcomb = PrivateKeyTcomb(private_key_object)
                store.add( private_key_object )
                keys.set( private_key_object.pubkey, private_tcomb )
                ChainStore.getAccountRefsOfKey(private_key_object.pubkey)
            }
        })
        this.setState({ keys })
        this.binaryBackupRecommended()
        return duplicate_count
    }
    
    binaryBackupRecommended() {
        CachedPropertyActions.set("backup_recommended", true)
    }
    
    pendingOperation() {
        this.pending_operation_count++
        this.setState({pending_operation_count: this.pending_operation_count})
    }
    
    pendingOperationDone() {
        if(this.pending_operation_count == 0)
            throw new Error("Pending operation done called too many times")
        this.pending_operation_count--
        this.setState({pending_operation_count: this.pending_operation_count})
    }
    
    privateKeyStorageError(property, error) {
        this.pendingOperationDone()
        var state = { privateKeyStorage_error: true }
        state["privateKeyStorage_error_" + property] = error
        console.error("privateKeyStorage_error_" + property, error)
        this.setState(state)
    }

    decodeMemo(memo) {
        let lockedWallet = false;
        let memo_text, isMine = false;
        let from_private_key = this.state.keys.get(memo.from)
        let to_private_key = this.state.keys.get(memo.to)
        let private_key = from_private_key ? from_private_key : to_private_key;
        let public_key = from_private_key ? memo.to : memo.from;
        public_key = PublicKey.fromPublicKeyString(public_key)

        try {
            private_key = WalletDb.decryptTcomb_PrivateKey(private_key);
        }
        catch(e) {
            // Failed because wallet is locked
            lockedWallet = true;
            private_key = null;
            isMine = true;            
        }

        if (private_key) {
            let tryLegacy = false;
            try {
                memo_text = private_key ? Aes.decrypt_with_checksum(
                    private_key,
                    public_key,
                    memo.nonce,
                    memo.message
                ).toString("utf-8") : null;

                if (private_key && !memo_text) {
                    // debugger
                    
                }
            } catch(e) {
                console.log("transfer memo exception ...", e);            
                memo_text = "*";
                tryLegacy = true;
            }

            // Apply legacy method if new, correct method fails to decode
            if (private_key && tryLegacy) {
                // debugger;
                try {
                    memo_text = Aes.decrypt_with_checksum(
                        private_key,
                        public_key,
                        memo.nonce,
                        memo.message,
                        true
                    ).toString("utf-8");
                } catch(e) {
                    console.log("transfer memo exception ...", e);            
                    memo_text = "**";
                }            
            }
        }

        return {
            text: memo_text,
            isMine
        }
    }
    
}

export default alt.createStore(PrivateKeyStore, "PrivateKeyStore");
