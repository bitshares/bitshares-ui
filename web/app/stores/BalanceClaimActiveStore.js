import alt from "alt-instance"
import Immutable from "immutable"
import BaseStore from "stores/BaseStore"
import {Address, PublicKey, key, ChainStore} from "graphenejs-lib";
import {Apis} from "graphenejs-ws";
import iDB from "idb-instance"
import PrivateKeyStore from "stores/PrivateKeyStore"
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions"
import TransactionConfirmActions from "actions/TransactionConfirmActions"
import WalletActions from "actions/WalletActions"

class BalanceClaimActiveStore extends BaseStore {

    constructor() {
        super()
        this.state = this._getInitialState()
        this.no_balance_address = new Set() // per chain
        this._export("reset")
        // ChainStore.subscribe(this.chainStoreUpdate.bind(this))
        this.bindListeners({
            onSetPubkeys: BalanceClaimActiveActions.setPubkeys,
            onSetSelectedBalanceClaims: BalanceClaimActiveActions.setSelectedBalanceClaims,
            onClaimAccountChange: BalanceClaimActiveActions.claimAccountChange,
            onTransactionBroadcasted: TransactionConfirmActions.wasBroadcast
        })
    }

    _getInitialState() {
        // reset for each wallet
        this.pubkeys = null
        this.addresses = new Set()
        var state = this.getInitialViewState()
        state.address_to_pubkey = new Map()
        return state
    }

    getInitialViewState() {
        // reset in-between balance claims
        return {
            balances: undefined,
            checked: Immutable.Map(),
            selected_balances: Immutable.Seq(),
            claim_account_name: undefined,
            loading: true
        }
    }

    /** Reset for each wallet load or change */
    reset() {
        this.setState(this._getInitialState())
    }

    // onImportBalance() {
    //     // Imorted balance just ran, not included in the blockchain yet
    //     this.setState(this.getInitialViewState())
    // }

    onTransactionBroadcasted() {
        // Balance claims are included in a block...
        // chainStoreUpdate did not include removal of balance claim objects
        // This is a hack to refresh balance claims after a transaction.
        this.refreshBalances()
    }

    // chainStoreUpdate did not include removal of balance claim objects
    // chainStoreUpdate() {
    //     if(this.balance_objects_by_address !== ChainStore.balance_objects_by_address) {
    //         console.log("ChainStore.balance_objects_by_address")
    //         this.balance_objects_by_address = ChainStore.balance_objects_by_address
    //     }
    // }

    // param: Immutable Seq or array
    onSetPubkeys(pubkeys) {

        if( Array.isArray( pubkeys )) pubkeys = Immutable.Seq( pubkeys )
        if(this.pubkeys && this.pubkeys.equals( pubkeys )) return
        this.reset()
        this.pubkeys = pubkeys
        if( pubkeys.size === 0) {
            this.setState({ loading: false })
            return true;
        }
        this.setState({ loading: true })
        this.loadNoBalanceAddresses().then( () => {
            // for(let pubkey of pubkeys) {
            this.indexPubkeys(pubkeys)
            // }

            this.refreshBalances();
            return false;
        }).catch( error => console.error( error ));
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

    indexPubkeys(pubkeys) {
        let {address_to_pubkey} = this.state;

        for(let pubkey of pubkeys) {
            for(let address_string of key.addresses(pubkey)) {
                if( !this.no_balance_address.has(address_string)) {
                    // AddressIndex indexes all addresses .. Here only 1 address is involved
                    address_to_pubkey.set(address_string, pubkey)
                    this.addresses.add(address_string)
                }
            }
        }
        this.setState({address_to_pubkey: address_to_pubkey})
    }

    indexPubkey(pubkey) {

        for(let address_string of key.addresses(pubkey)) {
            if( !this.no_balance_address.has(address_string)) {
                // AddressIndex indexes all addresses .. Here only 1 address is involved
                this.state.address_to_pubkey.set(address_string, pubkey)
                this.addresses.add(address_string)
            }
        }
        this.setState({address_to_pubkey: this.state.address_to_pubkey})
    }

    refreshBalances() {
        this.lookupBalanceObjects().then( balances => {
            var state = this.getInitialViewState()
            state.balances = balances
            state.loading = false
            this.setState(state);
        })
    }

    /** @return Promise.resolve(balances) */
    lookupBalanceObjects() {
        console.log("BalanceClaimActiveStore.lookupBalanceObjects")
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
                return balances
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
