import alt from "../alt-instance";
import iDB from "../idb-instance";
import Immutable from "immutable";
import BaseStore from "./BaseStore";
import { ChainStore } from "@graphene/chain"
import PrivateKeyStore from "stores/PrivateKeyStore"
import PrivateKeyActions from "actions/PrivateKeyActions"

class AccountRefsStore extends BaseStore {
    
    constructor() {
        super()
        this._export("loadDbData")
        this.state = this._getInitialState()
        this.bindListeners({ onAddPrivateKey: PrivateKeyActions.addKey })
        this.no_account_refs = Immutable.Set() // Set of account ids
        ChainStore.subscribe(this.chainStoreUpdate.bind(this))
    }
    
    _getInitialState() {
        this.chainstore_account_ids_by_key = null
        return {
            account_refs: Immutable.Set()
            // loading_account_refs: false
        }
    }
    
    onAddPrivateKey({private_key_object}) {
        if(ChainStore.getAccountRefsOfKey(private_key_object.pubkey) !== undefined)
            this.chainStoreUpdate()
    }
    
    loadDbData() {
        this.setState(this._getInitialState())
        return loadNoAccountRefs()
            .then( no_account_refs => this.no_account_refs = no_account_refs )
            .then( ()=> this.chainStoreUpdate() )
    }

    chainStoreUpdate() {
        if(this.chainstore_account_ids_by_key === ChainStore.account_ids_by_key) return
        this.chainstore_account_ids_by_key = ChainStore.account_ids_by_key
        this.checkPrivateKeyStore()
    }
    
    checkPrivateKeyStore() {
        var no_account_refs = this.no_account_refs
        var account_refs = Immutable.Set()
        PrivateKeyStore.getState().keys.keySeq().forEach( pubkey => {
            if(no_account_refs.has(pubkey)) return
            var refs = ChainStore.getAccountRefsOfKey(pubkey)
            if(refs === undefined) return
            if( ! refs.size) {
                // Performance optimization... 
                // There are no references for this public key, this is going
                // to block it.  There many be many TITAN keys that do not have
                // accounts for example.
                {
                    // Do Not block brainkey generated keys.. Those are new and
                    // account references may be pending.
                    var private_key_object = PrivateKeyStore.getState().keys.get(pubkey)
                    if( typeof private_key_object.brainkey_sequence === 'number' ) {
                        return
                    }
                }
                no_account_refs = no_account_refs.add(pubkey)
                return
            }
            account_refs = account_refs.add(refs.valueSeq())
        })
        account_refs = account_refs.flatten()
        if( ! this.state.account_refs.equals(account_refs)) {
            // console.log("AccountRefsStore account_refs",account_refs.size);
            this.setState({account_refs})
        }
        if(!this.no_account_refs.equals(no_account_refs)) {
            this.no_account_refs = no_account_refs
            saveNoAccountRefs(no_account_refs)
        }
    }
    
}

export default alt.createStore(AccountRefsStore, "AccountRefsStore")

// Performance optimization for large wallets
function loadNoAccountRefs() {
    return iDB.root.getProperty("no_account_refs", [])
        .then( array => Immutable.Set(array) )
}

function saveNoAccountRefs(no_account_refs) {
    var array = []
    for(let pubkey of no_account_refs) array.push(pubkey)
    iDB.root.setProperty("no_account_refs", array)
}
