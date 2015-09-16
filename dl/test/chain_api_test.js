import assert from "assert"

import PublicKey from "ecc/key_public"
import PrivateKey from "ecc/key_private"
import ApiInstances from "rpc_api/ApiInstances"
import ChainStore from "api/ChainStore"
import th from "./test_helper"

var _catch = th.log_error

/**
    Usage: In ~/bts/graphene-ui/dl:
    npm test -- -g fetchObject --watch
        
    Enable protocol-level debugging:
    NODE_DEBUG=true npm test -- -g fetchObject --watch
        
    For parameters after the --, see:
    ./node_modules/.bin/mocha --help
*/
describe( "ChainStore", ()=> {
    
    var api
        
    before( done => {
        api = ApiInstances.instance()
        return api.init_promise.then( ()=> {
            ChainStore.init()
            done()
        }).catch( _catch )
    })
    
    after(()=>{
        api.close()
    })
    
    beforeEach( ()=> {
        ChainStore.init() 
    })
    
    afterEach( ()=> {
        ChainStore.subscribers.clear()
    })
    
    it( "getObject", done => {
        function update() {
            if(ChainStore.getObject("2.0.0") != undefined) {
                ChainStore.unsubscribe(update)
                done()
            }
        }
        ChainStore.subscribe(update)
        ChainStore.getObject("2.0.0")
    })
    
    it( "getAccount", done => {
        function update() {
            var set = ChainStore.getAccount("1.2.0")
            assert(set && set.size > 0, "missing account")
            if(set != undefined) {
                ChainStore.unsubscribe(update)
                done()
            }
        }
        ChainStore.subscribe(update)
        ChainStore.getAccount("1.2.0")
    })
    
    it( "getAccount byName", done => {
        function update() {
            var set = ChainStore.getAccount("init0")
            if(set != undefined) {
                ChainStore.unsubscribe(update)
                assert(set.get('active'))
                assert(set.get('owner').get("key_auths"))
                // console.log("... set", set, JSON.stringify(set,null,1))
                assert(set && set.size > 0, "missing account")
                done()
            }
        }
        ChainStore.subscribe(update)
        ChainStore.getAccount("init0")
    })
    
    it( "getAccountRefsOfKey", done => {
        var pubkey = PrivateKey.fromSeed("nathan").toPublicKey().toPublicKeyString()
        function update() {
            var set = ChainStore.getAccountRefsOfKey(pubkey)
            assert(set && set.size > 0, "empty set")
            if(set != undefined) {
                ChainStore.unsubscribe(update)
                done()
            }
        }
        ChainStore.subscribe(update)
        ChainStore.getAccountRefsOfKey(pubkey)
    })
    
    it( "getBalanceObjects", done => {
        var addy = "GPHHYhQcrjVg5kBzCoeeD38eQdncCC5pBgee"
        function update() {
            var set = ChainStore.getBalanceObjects(addy)
            assert(set.size > 0, "empty set")
            if(set != undefined) {
                ChainStore.unsubscribe(update)
                done()
            }
        }
        ChainStore.subscribe(update)
        ChainStore.getBalanceObjects(addy)
    })
    
})
