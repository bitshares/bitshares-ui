import Apis from "rpc_api/ApiInstances"

import PrivateKey from 'ecc/key_private'
import PublicKey from 'ecc/key_public'
import Aes from 'ecc/aes'
import key from "common/key_utils"

import WalletDb from 'stores/WalletDb'
import WalletManagerStore from 'stores/WalletManagerStore'
import AccountStore from 'stores/AccountStore'
import PrivateKeyStore from 'stores/PrivateKeyStore'
import ChainStore from "api/ChainStore"
import config from "chain/config"

import BackupActions from "actions/BackupActions"

import alt from 'alt-instance'
import iDB from 'idb-instance'

module.exports = {
    
    PrivateKey, PublicKey, Aes, key,
    WalletDb, WalletManagerStore, PrivateKeyStore,
    AccountStore, 
    BackupActions,
    ChainStore,
    
    alt, iDB,  Apis,
    db: ()=> Apis.instance().db_api(),
    config,
    
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
    
    //DEBUG AddressIndex: require('stores/AddressIndex')
}
