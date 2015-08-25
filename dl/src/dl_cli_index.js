module.exports = {
    
    PrivateKey: require('ecc/key_private'),
    PublicKey: require('ecc/key_public'),
    Aes: require('ecc/aes'),
    
    WalletDb: require('stores/WalletDb'),
    AccountStore: require('stores/AccountStore'),
    PrivateKeyStore: require('stores/PrivateKeyStore'),
    
    alt: require('alt-instance'),
    iDB: require('idb-instance'),
    Apis: require("rpc_api/ApiInstances"),
    
    init: context => {
        if( ! context) return
        for (var obj in module.exports) {
            if(obj === "init") continue
            context[obj] = module.exports[obj]
        }
    }
}