import WalletStore from "stores/WalletStore"
import ApplicationApi from "rpc_api/ApplicationApi"

import key from "common/key_utils"
import v from "common/validation"

var alt = require("../alt-instance")
var application_api = new ApplicationApi()

class WalletActions {
    
    constructor() {
        // https://github.com/cryptonomex/graphene-ui/issues/21
        //this.generateActions('create', 'lock');
    }

    createBrainKeyAccount(account_name, wallet_public_name){
        return new Promise((resolve, reject) => {
            if(WalletStore.isLocked(wallet_public_name)) {
                reject("locked wallet " + wallet_public_name)
                return
            }
            reject("not implemented")
            /*
            WalletStore.getState().wallets.get(wallet_public_name)
            application_api.create_account_with_brain_key(
                brain_key,
                new_account_name,
                registrar_id,
                referrer_id,
                referrer_percent,
                expire_minutes,
                signer_private_key_id,
                signer_private_key,
                true //broadcast
            )*/
        })
    }
}

module.exports = alt.createActions(WalletActions);
