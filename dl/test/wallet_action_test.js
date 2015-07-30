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
import helper from "./test_helper"

var _catch = th.log_error

describe( "wallet_actions", ()=> {
    
    var api
    
    before( done => {
        iDB.init_instance(fakeIndexedDB).init_promise.then( ()=>  {
            api = ApiInstances.instance()
            api.init_promise.then( ()=>
                done()
            ).catch( _catch )
        })
    })
    
    after(()=>{
        iDB.instance().db().close()
        // Does Not delete the database ???
        fakeIndexedDB.deleteDatabase("graphene_db")
        api.close()
    })
    
    it( "wallet_create", done => {
        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        var public_name = "default_" + suffix
        helper.test_wallet( suffix ).then(()=>{
            WalletDb.onLock()
            assert( WalletDb.isLocked(), "isLocked" )
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
        helper.test_wallet( suffix ).then(()=>{
            return WalletActions.createBrainKeyAccount(
                "brainaccount-"+ suffix,
                "nathan", "nathan",
                100
            ).then(()=> {
                done()
            })
        }).catch(_catch)
    })
    
// todo
//    it( "import_balance", done => {
//        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
//        var wif_keys = [ PrivateKey.fromSeed("nathan").toWif() ]
//        test_wallet(suffix).then( ()=> {
//            return test_account( suffix ).then( account_name => {
//                return WalletActions.importBalance(
//                    account_name,
//                    wif_keys,
//                    true //broadcast
//                )
//            })
//        }).then(()=>done()).catch(_catch)
//    })

})

