import iDB from "../src/idb-instance"
import fakeIndexedDB from "fake-indexeddb"

import WalletStore from "../src/stores/WalletStore"
import WalletActions from "../src/actions/WalletActions"

import ApiInstances from "../src/rpc_api/ApiInstances"
import WalletApi from "../src/rpc_api/WalletApi"
import ApplicationApi from "../src/rpc_api/ApplicationApi"

import th from "./test_helper"
import secureRandom from "secure-random"
import assert from "assert"

var _catch = th.log_error

describe( "wallet_actions", ()=> {
    
    var api
    iDB.init_instance(fakeIndexedDB)
    
    before( done => {
        //var request = fakeIndexedDB.deleteDatabase("graphene_db")
        //request.onerror = e => {console.error(e)}
        //request.onsuccess = ()=>{
        //  not being called
        //}
        api = ApiInstances.instance()
        api.init_promise.then( ()=>
            done()
        ).catch( _catch )
    })
    
    after(()=>{
        api.close()
        //var request = fakeIndexedDB.deleteDatabase("graphene_db")
        //request.onerror = e => {console.error(e)}
        //request.onsuccess = ()=>{
        //    done() // not being called
        //}
    })
    
    it( "wallet_create", done => {
        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        var public_name = "default_"+ suffix
        WalletStore.onCreate( public_name, "password","brainkey" ).then(()=>{
            assert( WalletStore.getWallet(public_name) != null )
            assert( WalletStore.getWallet(public_name).id != null )
            assert( WalletStore.getCurrentWallet() == public_name )
            WalletStore.validatePassword( public_name, "password", true )
            assert( WalletStore.getBrainKey(public_name) == "brainkey" )
            WalletStore.onLock(public_name)
            assert ( WalletStore.isLocked(public_name) )
            new Promise( (resolve, reject) => {
                var trx = WalletStore.transaction(resolve, reject)
                WalletStore.incrementBrainKeySequence(public_name, trx).then( ()=> {
                    done()
                
                }).catch(_catch)
            }).then().catch(_catch)
        }).catch(_catch)
    })
    
    it( "create_account_with_brain_key", done => {
        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        var public_name = "default_"+ suffix
        WalletStore.onCreate( public_name, "password","brainkey" ).then(()=>{
            WalletStore.validatePassword( public_name, "password", true )
            WalletActions.createBrainKeyAccount(
                "account", public_name
            ).then( ()=> {
                done()
            }).catch(_catch)
            
        }).catch(_catch)
    })

})
