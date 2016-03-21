import assert from "assert"
import Immutable from "immutable"
import { Apis, fetchChain, ChainStore } from "@graphene/chain"

describe("API", () => {
    
    // Connect once for all tests
    before(()=> Apis.instance("ws://localhost:8090").init_promise )
    
    // Unsubscribe everything after each test
    afterEach(()=>{
        ChainStore.subscribers = new Set()
        ChainStore.clearCache()
    })

    describe("Subscriptions", () => {
        
        it("Asset not found", ()=> {
            return new Promise( resolve =>{
                ChainStore.subscribe(()=>{
                    console.log("dddooonnneee")
                    assert(ChainStore.getAsset("NOTFOUND") === null)
                    resolve()
                })
                assert(ChainStore.getAsset("NOTFOUND") === undefined)
            })
        })
        
        it("Asset by name", ()=> {
            return new Promise( resolve =>{
                ChainStore.subscribe(()=>{
                    assert(ChainStore.getAsset("CORE") != null)
                    resolve()
                })
                assert(ChainStore.getAsset("CORE") === undefined)
            })
        })
        
        // it("Asset by id", ()=> {
        //     return new Promise( resolve =>{
        //         ChainStore.subscribe(()=>{
        //             // assert(ChainStore.getAsset("1.3.0") != null)
        //             console.log("ChainStore.getAsset(1.3.0)", ChainStore.getAsset("1.3.0"))
        //             resolve()
        //         })
        //         assert(ChainStore.getAsset("1.3.0") === undefined)
        //     })
        // })
        
        
    })
        //     ChainStore.getAccount("not found")
        //     
        //     ChainStore.unsubscribe(cb)
        //     // return fetchChain("getAccount", "notfound")
        //     let cb = res => console.log('res',res)
        //     // })
        // })
    

})