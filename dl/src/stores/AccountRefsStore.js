import alt from "../alt-instance";
import iDB from "../idb-instance";
import Immutable from "immutable";
import BaseStore from "./BaseStore";
import { ChainStore } from "@graphene/chain"
// import { chain_config } from "@graphene/chain"
// import { LocalStoragePersistence } from "@graphene/wallet-client"

/**
    Performance optimization for large wallets.  This needs to be loaded when the chain id becomes available or it changes.  Updates come via the ChainStore.
*/
class AccountRefsStore extends BaseStore {
    
    constructor() {
        super()
        this._export("loadDbData")
        this.state = this._getInitialState()
        // this.bindListeners({ onAddPrivateKey: PrivateKeyActions.addKey })
        this.no_account_refs = Immutable.Set() // Set of account ids
        ChainStore.subscribe(this.chainStoreUpdate.bind(this))
        
        // private
        this.updateNoAccountRefs = updateNoAccountRefs.bind(this)
        this.loadNoAccountRefs = loadNoAccountRefs.bind(this)
        this.saveNoAccountRefs = saveNoAccountRefs.bind(this)
    }
    
    _getInitialState() {
        this.chainstore_account_ids_by_key = null
        return {
            account_refs: Immutable.Set()
        }
    }
    
    // onAddPrivateKey({private_key_object}) {
    //     if(ChainStore.getAccountRefsOfKey(private_key_object.pubkey) !== undefined)
    //         this.chainStoreUpdate()
    // }
    
    loadDbData() {
        this.setState(this._getInitialState())
        return this.loadNoAccountRefs()
            .then( no_account_refs => this.no_account_refs = no_account_refs )
            .then( ()=> this.chainStoreUpdate() )
    }

    chainStoreUpdate() {
        if(this.chainstore_account_ids_by_key === ChainStore.account_ids_by_key) return
        this.chainstore_account_ids_by_key = ChainStore.account_ids_by_key
        this.updateNoAccountRefs()
    }
    
}

export default alt.createStore(AccountRefsStore, "AccountRefsStore")

function updateNoAccountRefs() {
    var no_account_refs = this.no_account_refs
    var account_refs = Immutable.Set()
    WalletDb.keys().forEach( (key, pubkey) => {
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
                if( key.get("brainkey_sequence") != null )
                    return
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
        this.saveNoAccountRefs(no_account_refs)
    }
}

function loadNoAccountRefs() {
    // this.storage = new LocalStoragePersistence("AccountRefs::"+ chain_config.address_prefix, true)
    // return Promise.resolve( Immutable.Set(this.storage.getState()) )
    return iDB.root.getProperty("no_account_refs", [])
        .then( array => Immutable.Set(array) )
}

function saveNoAccountRefs(no_account_refs) {
    // this.storate.setState(array)
    var array = []
    for(let pubkey of no_account_refs) array.push(pubkey)
    iDB.root.setProperty("no_account_refs", array)
}
