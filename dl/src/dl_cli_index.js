module.exports = {
    PrivateKey: require('ecc/key_private'),
    PublicKey: require('ecc/key_public'),
    Aes: require('ecc/aes'),
    WalletDb: require('stores/WalletDb'),
    AccountStore: require('stores/AccountStore'),
    alt: require('alt-instance'),
    init: context => {
        if( ! context) return
        for (var obj in module.exports) {
            if(obj === "init") continue
            context[obj] = module.exports[obj]
        }
    }
}