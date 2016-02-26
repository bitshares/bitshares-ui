import { Apis } from "@graphene/chain"
import { ChainStore } from "@graphene/chain"
import { Aes, PrivateKey, PublicKey, key } from "@graphene/ecc"

import WalletDb from 'stores/WalletDb'
import WalletManagerStore from 'stores/WalletManagerStore'
import AccountStore from 'stores/AccountStore'

import BackupActions from "actions/BackupActions"
import WalletActions from "actions/WalletActions"

import alt from 'alt-instance'
import iDB from 'idb-instance'
import { chain_config } from "@graphene/chain"

import AccountRefsStore from "stores/AccountRefsStore"
import { AddressIndex } from "@graphene/wallet-client"

module.exports = {
    
    PrivateKey, PublicKey, Aes, key,
    WalletDb, WalletManagerStore,
    WalletActions,
    AccountStore, 
    BackupActions,
    ChainStore,
    chain_config,
    
    // Debugging, these may be removed
    AccountRefsStore, AddressIndex,
    
    alt, iDB,  Apis,
    db: ()=> Apis.instance().db_api(),
    
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
    },
    
}
