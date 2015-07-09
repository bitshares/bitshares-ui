import iDB from "../src/idb-instance"
import fakeIndexedDB from "fake-indexeddb"

import WalletActions from "../src/actions/WalletActions"
import WalletDb from "../src/stores/WalletDb"

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
        new Promise((resolve, reject) => {
            var transaction = WalletDb.transaction(resolve, reject)
            resolve(
                WalletDb.onCreateWallet({ 
                    wallet_public_name: public_name,
                    password_plaintext: "password",
                    brainkey_plaintext: "brainkey" + suffix,
                    transaction
                }).then(()=>{
                    assert( WalletDb.getWallet(public_name) != null )
                    assert( WalletDb.getWallet(public_name).id != null )
                    assert( WalletDb.getCurrentWallet() == public_name )
                    WalletDb.validatePassword( public_name, "password", true )
                    assert( WalletDb.getBrainKey(public_name) == "brainkey"  + suffix )
                    WalletDb.onLock(public_name)
                    assert ( WalletDb.isLocked(public_name) )
                    return new Promise( (resolve, reject) => {
                        var transaction = WalletDb.transaction(resolve, reject)
                        resolve( WalletDb.incrementBrainKeySequence({
                            wallet_public_name:public_name,
                            transaction
                        }).then( ()=> {
                            done()
                        }) )
                    })
                })
            )
        }).catch(_catch)
    })
    
    it( "create_account_with_brain_key", done => {
        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        var public_name = "default_"+ suffix
        new Promise((resolve, reject) => {
            var transaction = WalletDb.transaction(resolve, reject)
            resolve( WalletDb.onCreateWallet({
                wallet_public_name: public_name,
                password_plaintext: "password",
                brainkey_plaintext: "brainkey" + suffix,
                transaction
            }).then(()=>{
                WalletDb.validatePassword( public_name, "password", true )
                return WalletActions.createBrainKeyAccount({
                    account_name:"account-" + suffix,
                    wallet_public_name: public_name,
                    transaction
                }).then( ()=> {
                    done()
                })
            }) )
        }).catch(_catch)
    })
    
    it( "import_balance", done =>
        done()
    )

})

