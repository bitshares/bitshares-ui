import Immutable from "immutable";
import alt from "../alt-instance";
import BaseStore from "./BaseStore";
import iDB from "../idb-instance";
import idb_helper from "../idb-helper";

import {PrivateKeyTcomb} from "./tcomb_structs";
import PrivateKeyActions from "actions/PrivateKeyActions"
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
            addresses: Immutable.Map(),
            catastrophic_error: false,
            pending_operation_count: 0,
            catastrophic_error_add_key: null,
            catastrophic_error_loading: null
        }
    }
    
    hasKey(pubkey) {
        return this.state.keys.has(pubkey)
    }
    
    getPubkeys() {
        return this.state.keys.valueSeq().map( value => value.pubkey).toArray()
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
            for (let addy of addys) {
                var pubkey = this.state.addresses.get(addy)
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
    onLoadDbData(resolve) {//resolve is deprecated
        this.pendingOperation() 
        this.setState(this._getInitialState())
        var keys = Immutable.Map().asMutable()
        var addresses = Immutable.Map().asMutable()
        var p = loadAddyMap().then( addresses => {
            var emtpy_addresses = addresses.size === 0
            // Updating addresses is slow, so addresses is created once
            // and then maintained.
            if(emtpy_addresses) addresses = addresses.asMutable()
            return idb_helper.cursor("private_keys", cursor => {
                if( ! cursor) {
                    this.setState({
                        keys: keys.asImmutable(),
                        addresses: addresses.asImmutable()
                    })
                    if(emtpy_addresses) saveAddyMap(addresses)
                    return
                }
                var private_key_tcomb = PrivateKeyTcomb(cursor.value)
                keys.set(private_key_tcomb.pubkey, private_key_tcomb)
                if(emtpy_addresses) updateAddressMap(addresses, private_key_tcomb.pubkey)
                cursor.continue()
            }).then(()=>{
                this.pendingOperationDone()
            }).catch( error => {
                this.setState(this._getInitialState())
                this.catastrophicError('loading', error)
            })
        })
        resolve( p )
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
        this.state.addresses = this.state.addresses.withMutations( addresses => {
            updateAddressMap(addresses, private_key_object.pubkey)
            saveAddyMap(addresses)
        })
        this.setState({keys: this.state.keys, addresses: this.state.addresses})

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
    
}

module.exports = alt.createStore(PrivateKeyStore, "PrivateKeyStore");

function loadAddyMap() {
    return iDB.root.getProperty("PrivateKeyStore_addresses").then( map =>
        map ? Immutable.Map(map) : Immutable.Map())
}

function updateAddressMap(addresses, pubkey) {
    var public_key = PublicKey.fromPublicKeyString(pubkey)
    var address_strings = [
        //legacy formats
        Address.fromPublic(public_key, false, 0).toString(), //btc_uncompressed
        Address.fromPublic(public_key, true, 0).toString(),  //btc_compressed
        Address.fromPublic(public_key, false, 56).toString(),//pts_uncompressed
        Address.fromPublic(public_key, true, 56).toString(), //pts_compressed
        public_key.toAddressString() //bts_short, most recent format
    ]
    for(let address of address_strings) {
        addresses.set(address, pubkey)
    }
}

function saveAddyMap(map) {
    return iDB.root.setProperty("PrivateKeyStore_addresses", map.toObject())
}
