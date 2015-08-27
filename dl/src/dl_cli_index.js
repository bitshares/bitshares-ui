import Apis from "rpc_api/ApiInstances"

module.exports = {
    
    PrivateKey: require('ecc/key_private'),
    PublicKey: require('ecc/key_public'),
    Aes: require('ecc/aes'),
    
    WalletDb: require('stores/WalletDb'),
    AccountStore: require('stores/AccountStore'),
    PrivateKeyStore: require('stores/PrivateKeyStore'),
    
    alt: require('alt-instance'),
    iDB: require('idb-instance'),
    
    Apis,
    // db: Apis.instance().db_api(), //why is this null?
    chain_api: require("api/chain"),
    
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