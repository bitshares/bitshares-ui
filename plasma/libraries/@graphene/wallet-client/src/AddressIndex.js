import { List } from "immutable"
import { key } from "@graphene/ecc"
import { chain_config } from "@graphene/chain"
import LocalStoragePersistence from "./LocalStoragePersistence"

/**
    Disk Cache (for performance) for legacy addresses used for BTS 1.0 shorts and balance claims.
    
    Singleton
    
    Call init if the chain ID changes after this object was constructed..
    
    this.storage.state: Map<string, array> - { "pubkey": ["addresses"] } 
*/
class AddressIndex {
    
    constructor() {
        this.init()
    }
    
    init() {
        this.storage = new LocalStoragePersistence("AddressIndex::"+ chain_config.address_prefix)
    }
    
    /**
        @arg {List<string>|string} "pubkey1", ...
        @return {Promise}
    */
    add( pubkeys ) {
        
        pubkeys = List(pubkeys)
        if( ! pubkeys.size )
            return Promise.resolve()
        
        let addresses = this.storage.getState()
        pubkeys = pubkeys.filterNot( pubkey => addresses.has(pubkey))
        if( ! pubkeys.size )
            return Promise.resolve()
        
        this.indexing = true
        try {
            var AddressIndexWorker = require("worker!./AddressIndexWorker")
            return new Promise( (resolve, reject) =>{
                // much faster
                var worker = new AddressIndexWorker
                // browser
                worker.postMessage({ pubkeys: pubkeys.toJS(), address_prefix: chain_config.address_prefix })
                worker.onmessage = event => {
                    try {
                        var key_addresses = event.data
                        addresses = addresses.withMutations( addresses => {
                            for(let i = 0; i < pubkeys.size; i++) {
                                var address_array = key_addresses[i]
                                addresses.set(pubkeys.get(i), List(address_array))
                            }
                            // console.log("AddressIndex loaded", addresses.size)
                            
                        })
                        this.indexing = false
                        this.storage.setState( addresses )
                        resolve()
                    } catch( e ) {
                        this.indexing = false
                        console.error("AddressIndexWorker.add.onmessage", e, "stack", e.stack)
                        reject(e)
                    }
                }
            })
        } catch( error ) {
            // nodejs
            try {
                this.indexing = true
                pubkeys.forEach( pubkey => {
                    var address_array = key.addresses(pubkey)// S L O W
                    addresses = addresses.set(pubkey, List(address_array))
                })
                this.storage.setState( addresses )
            } catch( error ) {
                console.error('AddressIndex.add', e, "stack", e.stack)
                return Promise.reject( error )
            }
            this.indexing = false
            return Promise.resolve()
        }
        
    }
    
    getPubkey( address ) {
        let array = this.storage.state
            .findEntry( addresses => addresses.includes(address))
        
        return array ? array[0] : null
    }
    
    
}

export default new AddressIndex()