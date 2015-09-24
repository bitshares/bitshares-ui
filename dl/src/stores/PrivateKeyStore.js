import Immutable from "immutable";
import alt from "../alt-instance";
import BaseStore from "./BaseStore";
import iDB from "../idb-instance";
import idb_helper from "../idb-helper";
import ChainStore from "api/ChainStore"

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
        //ChainStore.subscribe(this.chainStoreUpdate.bind(this))
        this._export("hasKey", "getPubkeys", "getTcomb_byPubkey",
            "getPubkeys_having_PrivateKey", "loadDbData", "onAddKey");
    }
    
    _getInitialState() {
        this.chainstore_account_ids_by_key = null
        this.no_account_refs = Immutable.Set() // Set of account ids
        return {
            keys: Immutable.Map(),
            addresses: Immutable.Map(),
            account_refs: Immutable.Set(),
            // loading_account_refs: false,
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
    
    chainStoreUpdate() {
        if(this.chainstore_account_ids_by_key === ChainStore.account_ids_by_key) return
        this.chainstore_account_ids_by_key = ChainStore.account_ids_by_key
        var norefs = Immutable.Set()
        var account_refs = Immutable.Set()
        this.state.keys.keySeq().forEach( pubkey => {
                                          /*
            var refs = ChainStore.getAccountRefsOfKey(pubkey)
            if(refs === null) norefs = norefs.add(pubkey)
            else if(refs === undefined) {
                // this.setState({loading_account_refs: true})
                return
            }
            account_refs = account_refs.add(refs.valueSeq())
            */
        })
        account_refs = account_refs.flatten()
        if(!this.state.account_refs.equals(account_refs))
            this.setState({account_refs})
        if(!this.no_account_refs.equals(norefs))
            this.saveNoAccountRefs(norefs)
    }
    
    loadNoAccountRefs() {
        if(this.no_account_refs.size) return Promise.resolve()
        return iDB.root.getProperty("no_account_refs", [])
            .then( array => this.no_balance_address = new Set(array) )
    }
    
    saveNoAccountRefs(no_account_refs) {
        var array = []
        this.no_account_refs = no_account_refs
        for(let pubkey of this.no_account_refs) array.push(pubkey)
        console.log("saveNoAccountRefs", array.length)
        return iDB.root.setProperty("no_account_refs", pubkey)
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
    loadDbData() {//resolve is deprecated
        this.setState(this._getInitialState())
        var keys = Immutable.Map().asMutable()
        var addresses = Immutable.Map().asMutable()
        this.pendingOperation() 
        var p = loadAddyMap().then( addresses => {
            var emtpy_addresses = addresses.size === 0
            if(emtpy_addresses) addresses = addresses.asMutable()
            return idb_helper.cursor("private_keys", cursor => {
                if( ! cursor) {
                    this.setState({
                        keys: keys.asImmutable(),
                        addresses: addresses.asImmutable()
                    })
                    if(emtpy_addresses) saveAddyMap(addresses)
                    this.chainStoreUpdate()
                    return
                }
                var private_key_tcomb = PrivateKeyTcomb(cursor.value)
                //ChainStore.getAccountRefsOfKey(private_key_tcomb.pubkey)
                keys.set(private_key_tcomb.pubkey, private_key_tcomb)
                if(emtpy_addresses) updateAddressMap(addresses, private_key_tcomb.pubkey)
                cursor.continue()
            }).then(()=>{
                this.pendingOperationDone()
                this.chainStoreUpdate()
            }).catch( error => {
                this.setState(this._getInitialState())
                this.catastrophicError('loading', error)
            })
        })
        return this.loadNoAccountRefs().then(()=>p)
    }
    
    onAddKey(private_key_object, transaction) {// resolve is deprecated
        if(this.state.keys.has(private_key_object.pubkey)) {
            return Promise.resolve({result:"duplicate",id:null})
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

           /*
        if(ChainStore.getAccountRefsOfKey(private_key_object.pubkey) !== undefined)
            this.chainStoreUpdate()
            */
        
        var p = new Promise((resolve, reject) => {
            PrivateKeyTcomb(private_key_object)
            var duplicate = false
            var p = idb_helper.add(
                transaction.objectStore("private_keys"),
                private_key_object
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
                        this.setState({ keys: this.state.keys })
                    }
                )
                return {
                    result: "added", 
                    id: private_key_object.id
                }
            })
            resolve(p)
        })
        return p
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
