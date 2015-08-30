import assert from "assert"

import ApiInstances from "rpc_api/ApiInstances"
import chain_api from "api/ChainStore"
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
describe( "chain_api", ()=> {
    
    var api
        
    before( done => {
        api = ApiInstances.instance()
        return api.init_promise.then( ()=> {
            done()
        }).catch( _catch )
    })
    
    after(()=>{
        api.close()
    })
    
    it( "fetchObject", done => {
        var ps = [
            chain_api.fetchObject("2.0.0").then( result => {
                assert(result)
                assert.equal("2.0.0",result.get("id"))
            }),
            chain_api.fetchObject("1.3.9999").then( result => {
                assert.equal(null, result)
            }),
            chain_api.fetchObject( [ "2.0.0" ] ).then( result => {
                assert.equal(true, Array.isArray(result))
                assert.equal(1, result.length)
                assert.equal("2.0.0", result[0].get("id"))
            })
        ]
        Promise.all(ps).then(()=>{done()}).catch( _catch )
    })
    
})
