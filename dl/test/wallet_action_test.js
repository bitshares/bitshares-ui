import iDB from "../src/idb-instance"
import fakeIndexedDB from "fake-indexeddb"

import AccountActions from "../src/actions/AccountActions"
import WalletActions from "../src/actions/WalletActions"
import WalletDb from "../src/stores/WalletDb"

import ApiInstances from "../src/rpc_api/ApiInstances"
import WalletApi from "../src/rpc_api/WalletApi"
import ApplicationApi from "../src/rpc_api/ApplicationApi"
import PrivateKey from "../src/ecc/key_private"

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
        var public_name = "default_" + suffix
        test_wallet( suffix ).then(()=>{
            WalletDb.onLock()
            assert( WalletDb.isLocked() )
            assert( WalletDb.getWallet() != null )
            assert( WalletDb.getWallet().id != null )
            assert( WalletDb.getCurrentWalletName() == public_name )
            WalletDb.validatePassword( "password", true )
            assert( ! WalletDb.isLocked() )
            assert( WalletDb.getBrainKey() == "brainkey" + suffix )
            WalletDb.onLock()
            done()
        }).catch(_catch)
    })
    
    it( "create_account_with_brain_key", done => {
        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        test_wallet( suffix ).then(()=>{
            return WalletActions.createBrainKeyAccount(
                "brainaccount-"+ suffix 
            ).then(()=> {
                done()
            })
        }).catch(_catch)
    })
    
    it( "import_balance", done => {
        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        var wif_keys = [ PrivateKey.fromSeed("nathan").toWif() ]
        test_wallet(suffix).then( ()=> {
            return test_account( suffix ).then( account_name => {
                return WalletActions.importBalance(
                    account_name,
                    wif_keys,
                    true //broadcast
                )
            })
        }).then(()=>done()).catch(_catch)
    })

})

var test_wallet = (suffix) => {
    WalletDb.setCurrentWalletName("default_" + suffix)
    return WalletDb.onCreateWallet(
        "password",
        "brainkey" + suffix, 
        true // unlock  
    )
}

var test_account = ( suffix )=> {
    return AccountActions.createAccount(
        "account-"+ suffix
    )
}
