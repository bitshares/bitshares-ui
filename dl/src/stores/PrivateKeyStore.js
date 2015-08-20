import Immutable from "immutable";
import alt from "../alt-instance";
import BaseStore from "./BaseStore";
import iDB from "../idb-instance";
import idb_helper from "../idb-helper";

import {PrivateKeyTcomb} from "./tcomb_structs";

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
            "getPubkeys", "getTcombs_byPubkey",
            "getPubkeys_having_PrivateKey", "getByPublicKey");
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
        state["catastrophic_error_" + propery] = error
        console.log("catastrophic_error_" + propery, error)
        this.setState(state)
    }

    loadDbData() {
        if(this.loadDbDataDone) return Promise.resolve()
        var map = this.state.keys.asMutable()
        this.pendingOperation()
        return idb_helper.cursor("private_keys", cursor => {
            if( ! cursor) {
                this.state.keys = map.asImmutable()
                return
            }
            var private_key_tcomb = PrivateKeyTcomb(cursor.value)
            map.set(private_key_tcomb.id, private_key_tcomb)
            map.set(private_key_tcomb.pubkey, private_key_tcomb)
            cursor.continue()
        }).then(()=>{
            this.loadDbDataDone = true
            this.pendingOperationDone()
        }).catch( error => {
            this.setState(this._getInitialState())
            this.catastrophicError('loading', error)
        })
    }
    
    onAddKey(private_key_object, transaction, event_callback) {
        this.pendingOperation()
        this.setState({
            keys: this.state.keys.set(
                private_key_object.pubkey,
                PrivateKeyTcomb(private_key_object)
            )
        })
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
    
    // TODO move support for multiple wallets to indexeddb database name
    // this would have only one public key returned
    getPubkeys_having_PrivateKey(public_keys) {
        var return_public_keys = []
        for(let public_key of public_keys) {
            if(this.hasKey(public_key)) {
                return_public_keys.push(public_key)
            }
        }
        return return_public_keys
    }
    
    getByPublicKey(public_key) {
        if(! public_key) return null
        if(public_key.Q)
            public_key = public_key.toBtsPublic()
        
        return this.state.keys.get(public_key)
    }
    
    
    /** The same key may appear in multiple wallets.
        Use WalletDb.getPrivateKey instead.
    */
    getTcombs_byPubkey(public_key) {
        if(! public_key) return null
        if(public_key.Q)
            public_key = public_key.toBtsPublic()
        return this.state.keys.filter(
            value => value.pubkey == public_key
        ).toArray()
    }


}

module.exports = alt.createStore(PrivateKeyStore, "PrivateKeyStore");
