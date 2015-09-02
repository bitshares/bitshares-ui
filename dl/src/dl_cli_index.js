import Apis from "rpc_api/ApiInstances"

import PrivateKey from 'ecc/key_private'
import PublicKey from 'ecc/key_public'
import Aes from 'ecc/aes'
import key from "common/key_utils"

import WalletDb from 'stores/WalletDb'
import WalletStore from 'stores/WalletStore'
import AccountStore from 'stores/AccountStore'
import PrivateKeyStore from 'stores/PrivateKeyStore'
import chain_store from "api/ChainStore"

import BackupActions from "actions/BackupActions"

import alt from 'alt-instance'
import iDB from 'idb-instance'


module.exports = {
    
    PrivateKey, PublicKey, Aes, key,
    
    WalletDb, WalletStore, PrivateKeyStore,
    
    AccountStore, 
    
    BackupActions,
    
    alt, iDB,  Apis,
    db: Apis.instance().db_api(), // todo, fix db == undefined
    chain_store,
    
    resolve: (object, atty = "_") => {
        if( ! object["then"]) {
            console.log(object)
            return object
        }
        return new Promise( (resolve, reject) => {
            object.then( result => {
                console.log(result)
                resolve(result)
                window[atty] = result
            }).catch( error => {
                console.error(error)
                reject(error)
                window[atty] = error
            })
        })
    },
    
    init: context => {
        if( ! context) return
        for (var obj in module.exports) {
            if(obj === "init") continue
            context[obj] = module.exports[obj]
        }
    }
    
}
