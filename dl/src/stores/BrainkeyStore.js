import alt from "alt-instance"
import connectToStores from "alt/utils/connectToStores"
import key from "common/key_utils"
import Immutable from "immutable"
import ChainStore from "api/ChainStore"
import BaseStore from "stores/BaseStore"
import BrainkeyActions from "actions/BrainkeyActions"

/** Each instance supports a single brainkey. */
export default class BrainkeyStoreFactory {
    static instances = new Map()
    /** This may be called multiple times for the same <b>name</b>.  When done, 
        (componentWillUnmount) make sure to call this.closeInstance()
    */
    static getInstance(name) {
        var instance = BrainkeyStoreFactory.instances.get(name)
        if( ! instance) {
            instance = alt.createStore(BrainkeyStoreImpl, "BrainkeyStore")
            BrainkeyStoreFactory.instances.set(name, instance)
        }
        var subscribed_instance_key = name + " subscribed_instance"
        if( ! BrainkeyStoreFactory.instances.get(subscribed_instance_key)) {
            var subscribed_instance = instance.chainStoreUpdate.bind(instance)
            ChainStore.subscribe(subscribed_instance)
            BrainkeyStoreFactory.instances.set(subscribed_instance_key, subscribed_instance)
        }
        return instance
    }
    static closeInstance(name) {
        var instance = BrainkeyStoreFactory.instances.get(name)
        if(!instance) throw new Error("unknown instance " + name)
        var subscribed_instance_key = name + " subscribed_instance"
        var subscribed_instance = BrainkeyStoreFactory.instances.get(subscribed_instance_key)
        BrainkeyStoreFactory.instances.delete(subscribed_instance_key)
        ChainStore.unsubscribe(subscribed_instance)
        instance.clearCache()
    }
}

/** Derived keys may be unassigned from accounts therefore we must define a
    fixed block of derivied keys then monitor the entire block.
*/
var DERIVIED_BRAINKEY_POOL_SIZE = 10

class BrainkeyStoreImpl extends BaseStore {
    
    constructor() {
        super()
        this.clearCache()
        this.bindListeners({
            onSetBrainkey: BrainkeyActions.setBrainkey
        })
        this._export("inSync", "chainStoreUpdate", "clearCache")
    }
    
    // chainStoreUnsubscribe() {
    //     try{
    //         ChainStore.unsubscribe(this.chainStoreUpdate)
    //     }catch(e1) {console.log("unsub 1 fail");
    //         try{
    //             ChainStore.unsubscribe(this.chainStoreUpdate.bind(this))
    //         }catch(e2) {console.log("unsub 1 fail")}
    //     }
    // }
    
    clearCache() {
        this.state = {
            brnkey: "",
            account_ids: Immutable.Set()
        }
        this.derived_keys = new Array()
        // Compared with ChainStore.account_ids_by_key
        this.account_ids_by_key = null
    }
    
    /** Saves the brainkey and begins the lookup for derived account referneces */
    onSetBrainkey(brnkey) {
        this.clearCache()
        this.setState({brnkey})
        this.deriveKeys(brnkey)
        this.chainStoreUpdate()
    }
    
    /** @return <b>true</b> when all derivied account references are either
        found or known not to exist.
    */
    inSync() {
        this.derived_keys.forEach( derived_key => {
            if( isPendingFromChain(derived_key) )
                return false
        })
        return true
    }
    
    chainStoreUpdate() {
        if(! this.derived_keys.length) return
        if(this.account_ids_by_key === ChainStore.account_ids_by_key) return
        this.account_ids_by_key = ChainStore.account_ids_by_key
        this.updateAccountIds()
    }
    
    deriveKeys(brnkey = this.state.brnkey) {
        var sequence = this.derived_keys.length // next sequence (starting with 0)
        var private_key = key.get_brainkey_private(brnkey, sequence)
        var derived_key = derivedKeyStruct(private_key)
        this.derived_keys.push(derived_key)
        if(this.derived_keys.length < DERIVIED_BRAINKEY_POOL_SIZE)
            this.deriveKeys(brnkey)
    }
    
    updateAccountIds() {
        var new_account_ids = Immutable.Set().withMutations( new_ids => {
            var updatePubkey = public_string => {
                var chain_account_ids = ChainStore.getAccountRefsOfKey( public_string )
                if(chain_account_ids) chain_account_ids.forEach( chain_account_id => {
                    new_ids.add(chain_account_id)
                })
            }
            this.derived_keys.forEach( derived_key =>
                updatePubkey(derived_key.public_string) )
        })
        if( ! new_account_ids.equals(this.state.account_ids)) {
            this.state.account_ids = new_account_ids
            this.setState({account_ids: new_account_ids})
        }
    }
    
}

function derivedKeyStruct(private_key) {
    var public_string = private_key.toPublicKey().toPublicKeyString()
    var derived_key = {private_key, public_string}
    return derived_key
}

var isPendingFromChain = derived_key =>
    ChainStore.getAccountRefsOfKey( derived_key.public_string ) === undefined