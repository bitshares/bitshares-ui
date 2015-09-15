import Immutable from "immutable";
import alt from "../alt-instance";
import BaseStore from "./BaseStore";
import iDB from "../idb-instance";
import idb_helper from "../idb-helper";
import chain_store from "api/ChainStore"

import {PrivateKeyTcomb} from "./tcomb_structs";
import PublicKey from "ecc/key_public"
import Address from "ecc/address"

import hash from "../common/hash"

/** No need to wait on the promises returned by this store as long as
    this.state.catastrophic_error == false and
    this.state.pending_operation_count == 0 before performing any important
    operations.
*/
class PrivateKeyStore extends BaseStore {
    
    constructor() {
        super()
        this.state = this._getInitialState()
        this.pending_operation_count = 0
        
        /*this.bindListeners({
            onAddKey: PrivateKeyActions.addKey
        });*/
        this._export("loadDbData","onAddKey", "hasKey",
            "getPubkeys", "getTcomb_byPubkey",
            "getPubkeys_having_PrivateKey");
    }
    
    _getInitialState() {
        return {
            keys: Immutable.Map(),
            pubkey_to_addresses: new Map(),
            catastrophic_error: false,
            pending_operation_count: 0,
            catastrophic_error_add_key: null,
            catastrophic_error_loading: null
        }
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
    
    catastrophicError(property, error) {
        this.pendingOperationDone()
        var state = { catastrophic_error: true }
        state["catastrophic_error_" + property] = error
        console.log("catastrophic_error_" + property, error)
        this.setState(state)
    }

    /** This method may be called again should the main database change */
    loadDbData() {
        this.setState(this._getInitialState())
        var map = Immutable.Map().asMutable()
        this.pendingOperation()
        return idb_helper.cursor("private_keys", cursor => {
            if( ! cursor) {
                this.setState({keys: map.asImmutable()})
                return
            }
            var private_key_tcomb = PrivateKeyTcomb(cursor.value)
            map.set(private_key_tcomb.id, private_key_tcomb)
            map.set(private_key_tcomb.pubkey, private_key_tcomb)
            this.newPublicKey(private_key_tcomb.pubkey)
            cursor.continue()
        }).then(()=>{
            this.pendingOperationDone()
        }).catch( error => {
            this.setState(this._getInitialState())
            this.catastrophicError('loading', error)
        })
    }
    
    newPublicKey(pubkey) {
        /*
        chain_store.getAccountRefsOfKey(pubkey)
        var public_key = PublicKey.fromPublicKeyString(pubkey)
        var addresses = this.state.pubkey_to_addresses.get(pubkey)
        if(!addresses) this.state.pubkey_to_addresses.set(pubkey, addresses = new Set())
        for(let address_string of [
            Address.fromPublic(public_key, false, 0).toString(), //btc_uncompressed
            Address.fromPublic(public_key, true, 0).toString(),  //btc_compressed
            Address.fromPublic(public_key, false, 56).toString(),//pts_uncompressed
            Address.fromPublic(public_key, true, 56).toString(), //pts_compressed
        ]) {
            addresses.add(address_string)
            chain_store.getBalanceObjects(address_string)
        }
        */
    }
    
    onAddKey(private_key_object, transaction, event_callback) {
        if(this.state.keys.has(private_key_object.pubkey))
            return Promise.resolve({result:"duplicate",id:null})
        
        this.pendingOperation()
        //console.log("... onAddKey private_key_object.pubkey", private_key_object.pubkey)
        
        this.setState({
            keys: this.state.keys.set(
                private_key_object.pubkey,
                PrivateKeyTcomb(private_key_object)
            )
        })
        this.newPublicKey(private_key_object.pubkey)
        
        return new Promise((resolve, reject) => {
            PrivateKeyTcomb(private_key_object)
            var duplicate = false
            var p = idb_helper.add(
                transaction.objectStore("private_keys"),
                private_key_object,
                event_callback
            ).catch( event => {
                
                // ignore_duplicates
                var error = event.target.error
                //DEBUG
                console.log('... error',error)
                if( error.name != 'ConstraintError' ||
                    error.message.indexOf('by_encrypted_key') == -1
                ) {
                    this.catastrophicError('add_key', error)
                    throw event
                }
                duplicate = true
                event.preventDefault()
            }).then( ()=> {
                this.pendingOperationDone()
                
                if(duplicate)
                    return {result:"duplicate",id:null}
                
                idb_helper.on_transaction_end(transaction).then(
                    () => {
                        //DEBUG console.log('... this.state.keys.set',private_key_object.id)
                        this.setState({
                            keys: this.state.keys.set(
                                private_key_object.id,
                                PrivateKeyTcomb(private_key_object)
                            )
                        })
                    }
                )
                return {
                    result: "added", 
                    id: private_key_object.id
                }
            })
            resolve(p)
        })
    }

    hasKey(pubkey) {
        return this.state.keys.some(k => k.pubkey === pubkey);
    }
    
    getPubkeys() {
        return this.state.keys.valueSeq().map( value => value.pubkey).toArray()
    }
    
    getPubkeys_having_PrivateKey(public_keys) {
        var return_public_keys = []
        for(let public_key of public_keys) {
            if(this.hasKey(public_key)) {
                return_public_keys.push(public_key)
            }
        }
        return return_public_keys
    }
    
    getTcomb_byPubkey(public_key) {
        if(! public_key) return null
        if(public_key.Q)
            public_key = public_key.toPublicKeyString()
        return this.state.keys.get(public_key)
    }


}

module.exports = alt.createStore(PrivateKeyStore, "PrivateKeyStore");
