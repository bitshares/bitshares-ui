import key from "common/key_utils"
import v from "common/validation"

var alt = require("../alt-instance")

class WalletActions {
    
    constructor() {
        this.generateActions('lock');
    }

    lock(wallet_public_name = "default") {
        this.dispatch({wallet_public_name})
    }
    
    /*create(
        wallet_public_name = "default",
        password_plaintext,
        brainkey_plaintext,
        unlock = false
    ) {
        if(v.is_empty_user_input(secret_server_token))
            throw new Error("required: secret_server_token")
        
        if(v.is_empty_user_input(password_plaintext))
            throw new Error("required: password_plaintext")
        
        if(v.is_empty_user_input(brainkey_plaintext))
            throw new Error("required: brainkey_plaintext")
        
        this.dispatch({
            wallet_public_name,
            password_plaintext,
            brainkey_plaintext,
            unlock
        })
    }*/

}

module.exports = alt.createActions(WalletActions);
