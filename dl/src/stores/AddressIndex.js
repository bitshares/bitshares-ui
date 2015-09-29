import alt from "../alt-instance";
import iDB from "../idb-instance";
import key from "common/key_utils"
import Immutable from "immutable"
import BaseStore from "stores/BaseStore"

class AddressIndex extends BaseStore {
    
    constructor() {
        super()
        this.state = {
            addresses: Immutable.Map()
        }
        this.pubkeys = new Set()
        this._export("add")
    }
    
    /** Add public key string (if not already added) */
    add(pubkey) {
        this.loadAddyMap().then( () => {
            var dirty = false
            if(this.pubkeys.has(pubkey)) return
            this.pubkeys.add(pubkey)
            // Gather all 5 legacy address formats (see key.addresses)
            var address_strings = key.addresses(pubkey)
            for(let address of address_strings) {
                this.state.addresses = this.state.addresses.set(address, pubkey)
                dirty = true
            }
            if( dirty ) {
                this.setState({ addresses: this.state.addresses })
                this.saveAddyMap()
            }
        })
    }
    
    loadAddyMap() {
        if(this.loadAddyMapPromise) return this.loadAddyMapPromise
        this.loadAddyMapPromise = iDB.root.getProperty("AddressIndex").then( map => {
            this.state.addresses = map ? Immutable.Map(map) : Immutable.Map()
            console.log("AddressIndex load", this.state.addresses.size)
            this.state.addresses.valueSeq().forEach( pubkey => this.pubkeys.add(pubkey) )
            this.setState({ addresses: this.state.addresses })
        })
        return this.loadAddyMapPromise
    }
    
    saveAddyMap() {
        clearTimeout(this.saveAddyMapTimeout)
        this.saveAddyMapTimeout = setTimeout(()=> {
            console.log("AddressIndex save", this.state.addresses.size)
            return iDB.root.setProperty("AddressIndex", this.state.addresses.toObject())
        }, 100)
    }
    
}
// console.log("post msg a");
// worker.postMessage("a")
module.exports = alt.createStore(AddressIndex, "AddressIndex");
