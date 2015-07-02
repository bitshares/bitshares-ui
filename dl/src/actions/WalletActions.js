import WalletStore from "stores/WalletStore"
import ApplicationApi from "rpc_api/ApplicationApi"
import PrivateKey from "ecc/key_private"

import key from "common/key_utils"
import v from "common/validation"

var alt = require("../alt-instance")
var application_api = new ApplicationApi()

class WalletActions {

    constructor() {
    }

    createBrainKeyAccount(account_name, wallet_public_name){
        return new Promise((resolve, reject) => {
            if(WalletStore.isLocked(wallet_public_name)) {
                reject("locked wallet " + wallet_public_name)
                return
            }
            var wallet = WalletStore.getWallet(wallet_public_name)

            var params = {
                account_name: account_name,
                wallet: wallet,
                resolve, reject
            }
            return (params) => {
                var result = application_api.create_account_with_brain_key(
                    WalletStore.getBrainKey(params.wallet.public_name),
                    account_name,
                    15, //registrar_id,
                    0, //referrer_id,
                    100, //referrer_percent,
                    10, //expire_minutes,
                    PrivateKey.fromSeed("nathan"), //signer_private_key,
                    true, //broadcast
                    params.wallet.brainkey_sequence
                )
                return (params, result) => {
                    return result.trx_promise.then(() => {
                        return (params, result) => {
                            var transaction = WalletStore.transaction(
                                params.resolve,
                                params.reject
                            )
                            var save_owner_promise = WalletStore.saveKey(
                                null, //aes_private,
                                params.wallet.public_name,
                                params.wallet.id,
                                result.owner_privkey,
                                params.wallet.brainkey_sequence + "",
                                transaction
                            )
                            var save_active_promise = WalletStore.saveKey(
                                null, //aes_private,
                                params.wallet.public_name,
                                params.wallet.id,
                                result.active_privkey,
                                params.wallet.brainkey_sequence + ".0",
                                transaction
                            )
                            var incr_promise =
                                WalletStore.incrementBrainKeySequence(
                                    params.wallet.public_name,
                                    transaction
                                )
                            (params => {
                                return Promise.all([
                                    save_owner_promise,
                                    save_active_promise,
                                    incr_promise
                                ]).then( ()=> {
                                    this.dispatch(params)
                                    return params
                                })
                            })(params)
                        }(params, result)
                    })
                }(params, result)
            }(params)
        })
    }
}

module.exports = alt.createActions(WalletActions);
