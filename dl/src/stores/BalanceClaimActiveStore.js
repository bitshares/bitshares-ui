import alt from "alt-instance"
import Immutable from "immutable"
import cname from "classnames"

import Address from "ecc/address"
import PublicKey from "ecc/key_public"
import key from "common/key_utils"
import BaseStore from "stores/BaseStore"
import Apis from "rpc_api/ApiInstances"
import iDB from "idb-instance"
import config from "chain/config"
import PrivateKeyStore from "stores/PrivateKeyStore"
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions"
import TransactionConfirmActions from "actions/TransactionConfirmActions"
import ChainStore from "api/ChainStore"

class BalanceClaimActiveStore extends BaseStore {
    
    constructor() {
        super()
        this.clearCache()
        this._export("clearCache")
        // ChainStore.subscribe(this.chainStoreUpdate.bind(this))
        this.bindListeners({
            onSetPubkeys: BalanceClaimActiveActions.setPubkeys,
            onSetSelectedBalanceClaims: BalanceClaimActiveActions.setSelectedBalanceClaims,
            onClaimAccountChange: BalanceClaimActiveActions.claimAccountChange,
            onTransactionConfirm: TransactionConfirmActions.wasBroadcast
        })
    }
    
    // chainStoreUpdate() {
    //     if(this.balance_objects_by_address !== ChainStore.balance_objects_by_address) {
    //         console.log("ChainStore.balance_objects_by_address")
    //         this.balance_objects_by_address = ChainStore.balance_objects_by_address
    //     }
    // }
    
    onTransactionConfirm() {
        // chainStoreUpdate did not include removal of balance claim objects
        // This is a hack to refresh balance claims after a transaction.
        this.setState({ checked: Immutable.Map() })
        this.lookupBalanceObjects()
    }
    
    clearCache() {
        this.state = {
            balances: new Immutable.List(),
            checked: Immutable.Map(),
            selected_balances: Immutable.Seq(),
            claim_account_name: undefined,
            address_to_pubkey: new Map(),
            loading: true
        }
        this.no_balance_address = new Set()
        this.addresses = new Set()
        this.pubkeys = null
    }
    
    onSetPubkeys(pubkeys) {
        if(this.pubkeys === pubkeys) return
        this.pubkeys = pubkeys
        this.clearCache()
        if(Array.isArray(this.pubkeys) && this.pubkeys.length === 0) return
        this.setState({ loading: true })
        this.loadNoBalanceAddresses().then( () => {
            
            for(let pubkey of pubkeys)
                this.indexPubkey(pubkey)
            
            return this.lookupBalanceObjects()
                
            
        }).catch( error => console.error( error ))
    }
    
    onSetSelectedBalanceClaims(checked) {
        var selected_balances = checked.valueSeq().flatten().toSet()
        this.setState({ checked, selected_balances })
    }
    
    onClaimAccountChange(claim_account_name) {
        this.setState({claim_account_name})
    }
    
    loadNoBalanceAddresses() {
        if(this.no_balance_address.size) return Promise.resolve()
        return iDB.root.getProperty("no_balance_address", [])
            .then( array => {
                // console.log("loadNoBalanceAddresses", array.length)
                this.no_balance_address = new Set(array)
            })
    }
    
    indexPubkey(pubkey) {
        for(let address_string of key.addresses(pubkey)) {
            if( ! this.no_balance_address.has(address_string)) {
                this.state.address_to_pubkey.set(address_string, pubkey)
                this.setState({address_to_pubkey: this.state.address_to_pubkey})
                this.addresses.add(address_string)
            }
        }
    }
    
    lookupBalanceObjects() {
        // console.log("BalanceClaimActiveStore.lookupBalanceObjects")
        var db = Apis.instance().db_api()
        var no_balance_address = new Set(this.no_balance_address)
        var no_bal_size = no_balance_address.size
        for(let addy of this.addresses) no_balance_address.add(addy)
        // for(let addy of this.addresses) ChainStore.getBalanceObjects(addy) // Test with ChainStore
        return db.exec("get_balance_objects", [this.addresses]).then( result => {
            var balance_ids = []
            for(let balance of result) balance_ids.push(balance.id)
            return db.exec("get_vested_balances", [balance_ids]).then( vested_balances => {
                var balances = Immutable.List().withMutations( balance_list => {
                    for(let i = 0; i < result.length; i++) {
                        var balance = result[i]
                        no_balance_address.delete(balance.owner)
                        if(balance.vesting_policy)
                            balance.vested_balance = vested_balances[i]
                        balance_list.push(balance)
                    }
                    if(no_bal_size !== no_balance_address.size)
                        this.saveNoBalanceAddresses(no_balance_address)
                            .catch( error => console.error( error ) ) 
                })
                this.setState({ balances, loading: false })
            })
        })
    }
    
    saveNoBalanceAddresses(no_balance_address) {
        this.no_balance_address = no_balance_address
        var array = []
        for(let addy of this.no_balance_address) array.push(addy)
        // console.log("saveNoBalanceAddresses", array.length)
        return iDB.root.setProperty("no_balance_address", array)
    }
    
}

export var BalanceClaimActiveStoreWrapped = alt.createStore(BalanceClaimActiveStore, "BalanceClaimActiveStore")
export default BalanceClaimActiveStoreWrapped