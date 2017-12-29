import iDB from "../src/idb-instance"
import fakeIndexedDB from "fake-indexeddb"

import BackupActions, {
    createWalletObject, createWalletBackup,
    decryptWalletBackup
} from "actions/BackupActions"
import AccountActions from "../src/actions/AccountActions"
import WalletActions from "../src/actions/WalletActions"
import WalletDb from "../src/stores/WalletDb"

import ApiInstances from "../app/api/ApiInstances"
import WalletApi from "../app/api/WalletApi"
import ApplicationApi from "../app/api/ApplicationApi"
import PrivateKey from "../src/ecc/key_private"

import th from "./test_helper"
import secureRandom from "secure-random"
import assert from "assert"
import helper from "./test_helper"

var _catch = th.log_error

describe( "wallet_actions", ()=> {
    
    var api
    
    // broadcast with confirmation waits for a block
    //this == undefined ??
    //this.setTimeout(it(), 3 * 1000)
    
    beforeEach( done => {
        api = ApiInstances.instance()
        api.init_promise.then( ()=>  {
            iDB.set_impl(fakeIndexedDB)
            var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
            //create a unique wallet name
            iDB.root.setProperty("current_wallet", "wallet" + suffix).then( ()=> {
                return iDB.init_instance().init_promise.then( ()=> {
                    done()
                })
            })
        }).catch( _catch )
    })
    
    afterEach(()=>{
        iDB.instance().db().close()
        // Does Not delete the database...
        fakeIndexedDB.deleteDatabase("graphene_db")
        api.close()
    })
    
    it("import_keys", done => {
        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        helper.test_wallet( suffix ).then(()=>{
            var private_key = PrivateKey.fromSeed("nathan")
            var wif = private_key.toWif()
            var private_key_obj = {
                wif,
                import_account_names: ["nathan"],
                public_key_string: private_key.toPublicKey().toPublicKeyString()
            }
            WalletDb.importKeys([ private_key_obj ]).then( result => {
                // console.log("importKeys", result)
                done()
            })
        }).catch(_catch)
    })
    
    it( "wallet_backups", done => {
        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        var public_name = "default_" + suffix
        helper.test_wallet( suffix ).then(()=>{
            
            return createWalletObject().then( wallet_object => {
                assert( wallet_object.wallet )
                var wallet_object_string = JSON.stringify(wallet_object, null, 0)
                var backup_private = PrivateKey.fromSeed("1")
                var backup_public = backup_private.toPublicKey()
                var backup_public_string = backup_public.toPublicKeyString()
                
                return createWalletBackup(
                    backup_public_string, wallet_object, 9,
                    secureRandom.randomBuffer(32).toString('binary')//"entropy"
                    ).then( binary_backup => {
                
                    //console.log('... binary_backup',binary_backup.length, "original", wallet_object_string.length, "bytes")
                
                    return decryptWalletBackup(backup_private.toWif(), binary_backup).then(
                        wallet_object2 => {
                        assert( wallet_object2.wallet )
                        var wallet_object2_string = JSON.stringify(wallet_object2, null, 0)
                        assert.equal(wallet_object_string, wallet_object2_string)
                        done()
                    })
                })
            })
        }).catch(_catch)
    })
    
    it( "wallet_create", done => {
        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        var public_name = "default_" + suffix
        helper.test_wallet( suffix ).then(()=>{
            WalletDb.onLock()
            assert( WalletDb.isLocked(), "isLocked" )
            assert( WalletDb.getWallet() != null )
            WalletDb.validatePassword( "password", true )
            assert( ! WalletDb.isLocked() )
            assert( WalletDb.getBrainKey() == "brainkey" + suffix )
            WalletDb.onLock()
            done()
        }).catch(_catch)
    })
    
    it( "create_account", done => {
        var suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        helper.test_wallet( suffix ).then(()=>{
            return WalletActions.createAccount(
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

