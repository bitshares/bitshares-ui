import alt from "../alt-instance";
import iDB from "../idb-instance";
import key from "common/key_utils"
import Immutable from "immutable"
import BaseStore from "stores/BaseStore"

class AddressIndex extends BaseStore {
    
    constructor() {
        super()
        this.state = {
            addresses: Immutable.Map(),
            saving: false
        }
        this.pubkeys = new Set()
        // loadAddyMap is for debugging, this.add will load this on startup
        this._export("add", "addAll", "loadAddyMap")
    }
    
    saving() {
        if( this.state.saving ) return
        this.state.saving = true
        this.setState({ saving: true })
    }
    
    /** Add public key string (if not already added).  Reasonably efficient
        for less than 10K keys.
    */
    add(pubkey) {
        this.loadAddyMap().then( () => {
            var dirty = false
            if(this.pubkeys.has(pubkey)) return
            this.pubkeys.add(pubkey)
            this.saving()
            // Gather all 5 legacy address formats (see key.addresses)
            var address_strings = key.addresses(pubkey)
            for(let address of address_strings) {
                this.state.addresses = this.state.addresses.set(address, pubkey)
                dirty = true
            }
            if( dirty ) {
                this.setState({ addresses: this.state.addresses })
                this.saveAddyMap()
            } else this.setState({saving: false})
        }).catch ( e => { throw e })
    }
    
    /** Worker thread implementation (for more than 10K keys) */
    addAll(pubkeys) {
        console.log("addAll");
        this.saving()
        this.loadAddyMap().then( () => {
            var AddressIndexWorker = require("worker!workers/AddressIndexWorker")
            var worker = new AddressIndexWorker
            worker.postMessage({ pubkeys })
            var _this = this
            worker.onmessage = event => { try {
                console.log("addAll onmessage");
                var key_addresses = event.data
                var dirty = false
                var addresses = _this.state.addresses.withMutations( addresses => {
                    for(let i = 0; i < pubkeys.length; i++) {
                        var pubkey = pubkeys[i]
                        if(_this.pubkeys.has(pubkey)) continue
                        _this.pubkeys.add(pubkey)
                        // Gather all 5 legacy address formats (see key.addresses)
                        var address_strings = key_addresses[i]
                        for(let address of address_strings) {
                            addresses.set(address, pubkey)
                            dirty = true
                        }
                    }
                })
                if( dirty ) {
                    _this.setState({ addresses })
                    _this.saveAddyMap()
                } else {
                    _this.setState({ saving: false })
                }
                console.log("addAll onmessage done");
            } catch( e ) { console.error('AddressIndex.addAll', e) }}
        }).catch ( e => { throw e })
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
            this.setState({saving: false})
            // If indexedDB fails to save, it will re-try via PrivateKeyStore calling this.add
            return iDB.root.setProperty("AddressIndex", this.state.addresses.toObject())
        }, 100)
    }
    
}
// console.log("post msg a");
// worker.postMessage("a")
module.exports = alt.createStore(AddressIndex, "AddressIndex");
