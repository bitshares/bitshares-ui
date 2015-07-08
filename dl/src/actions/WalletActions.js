import WalletStore from "../stores/WalletStore"
import ApplicationApi from "../rpc_api/ApplicationApi"
import PrivateKey from "../ecc/key_private"

import key from "../common/key_utils"
import v from "../common/validation"

//console.log('... WalletStore', Object.keys(WalletStore))

var alt = require("../alt-instance")
var application_api = new ApplicationApi()

class WalletActions {

    constructor() {
    }

    createBrainKeyAccount(_account_name, _wallet_public_name){
        return new Promise((resolve, reject) => {
            
            var account_name = _account_name
            var wallet_public_name = _wallet_public_name
            
            if(WalletStore.isLocked(wallet_public_name)) {
                reject("locked wallet " + wallet_public_name)
                return
            }
            var wallet = WalletStore.getWallet(wallet_public_name)

            var result = application_api.create_account_with_brain_key(
                WalletStore.getBrainKey(wallet.public_name),
                account_name,
                15, //registrar_id,
                0, //referrer_id,
                100, //referrer_percent,
                10, //expire_minutes,
                PrivateKey.fromSeed("nathan"), //signer_private_key,
                true, //broadcast
                wallet.brainkey_sequence
            )
            
            return result.trx_promise.then(() => {
                var transaction = WalletStore.transaction(
                    resolve,
                    reject
                )
                var save_owner_promise = WalletStore.saveKey(
                    null, //aes_private,
                    wallet.public_name,
                    wallet.id,
                    result.owner_privkey,
                    wallet.brainkey_sequence + "",
                    transaction
                )
                var save_active_promise = WalletStore.saveKey(
                    null, //aes_private,
                    wallet.public_name,
                    wallet.id,
                    result.active_privkey,
                    wallet.brainkey_sequence + ".0",
                    transaction
                )
                var incr_promise =
                    WalletStore.incrementBrainKeySequence(
                        wallet.public_name,
                        transaction
                    )
                return Promise.all([
                    save_owner_promise,
                    save_active_promise,
                    incr_promise
                ]).then( ()=> {
                    this.dispatch()
                    return
                }).catch( error => {
                    reject(error)
                })
            })
        })
    }
}

module.exports = alt.createActions(WalletActions);
