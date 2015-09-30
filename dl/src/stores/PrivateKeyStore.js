import Immutable from "immutable";
import alt from "../alt-instance";
import BaseStore from "./BaseStore";
import iDB from "../idb-instance";
import idb_helper from "../idb-helper";

import {PrivateKeyTcomb} from "./tcomb_structs";
import PrivateKeyActions from "actions/PrivateKeyActions"
import AddressIndex from "stores/AddressIndex"
import PublicKey from "ecc/key_public"
import Address from "ecc/address"

import hash from "common/hash"


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
        this.bindListeners({
            onLoadDbData: PrivateKeyActions.loadDbData,
            onAddKey: PrivateKeyActions.addKey
        })
        this._export("hasKey", "getPubkeys", "getTcomb_byPubkey",
            "getPubkeys_having_PrivateKey");
    }
    
    _getInitialState() {
        return {
            keys: Immutable.Map(),
            catastrophic_error: false,
            pending_operation_count: 0,
            catastrophic_error_add_key: null,
            catastrophic_error_loading: null
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
            this.catastrophicError('loading', error)
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
                    this.catastrophicError('add_key', error)
                    throw event
                }
                duplicate = true
                event.preventDefault()
            }).then( ()=> {
                this.pendingOperationDone()
                if(duplicate) return {result:"duplicate",id:null}
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
    
}

module.exports = alt.createStore(PrivateKeyStore, "PrivateKeyStore");
