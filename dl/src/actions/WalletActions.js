import WalletDb from "../stores/WalletDb"
import ApplicationApi from "../rpc_api/ApplicationApi"
import PrivateKey from "../ecc/key_private"

var alt = require("../alt-instance")
var application_api = new ApplicationApi()

class WalletActions {

    constructor() {
        this.generateActions(
            'brainKeyAccountCreated',
            'brainKeyAccountCreateError'
        )
    }

    createBrainKeyAccount({
        account_name,
        wallet_public_name = "default",
        transaction
    }) {
        if( WalletDb.isLocked(wallet_public_name)) {
            var error = "wallet locked: " + wallet_public_name
            this.actions.brainKeyAccountCreateError( error )
            return Promise.reject( error )
        }
        var wallet = WalletDb.getWallet(wallet_public_name)
        var result = application_api.create_account_with_brain_key(
            WalletDb.getBrainKey(wallet.public_name),
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
            return Promise.all([
                WalletDb.saveKeys({
                    wallet,
                    private_keys: [
                        {
                            privkey: result.owner_privkey,
                            sequence: wallet.brainkey_sequence + ""
                        },{
                            privkey: result.active_privkey,
                            sequence: wallet.brainkey_sequence + ".0"
                        }
                    ],
                    transaction
                }),
                WalletDb.incrementBrainKeySequence({
                    wallet_public_name: wallet.public_name,
                    transaction
                })
            ]).then(
                ()=> this.actions.brainKeyAccountCreated()
            ).catch( 
                error => this.actions.brainKeyAccountCreateError(error)
            )
        })
        //this.dispatch()
    }
}

module.exports = alt.createActions(WalletActions)
