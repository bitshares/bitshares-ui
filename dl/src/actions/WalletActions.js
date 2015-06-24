import key from "common/key_utils"

var alt = require("../alt-instance")
var aes_private_map = {}

class WalletActions {

    lock(wallet_public_name = "default") {
        delete aes_private_map[wallet_public_name]
    }
    
    isLocked(wallet_public_name) {
        return aes_private_map[wallet_public_name] ? false : true
    }
    
    create(
        wallet_public_name = "default",
        secret_server_token,
        password_plaintext,
        brainkey_plaintext,
        unlock = false
    ) {
        if(! secret_server_token || typeof secret_server_token != 'string')
            throw new Error("required: secret_server_token")
        
        if(! password_plaintext || typeof password_plaintext != 'string')
            throw new Error("required: password_plaintext")
        
        if(! brainkey_plaintext || typeof brainkey_plaintext != 'string')
            throw new Error("required: brainkey_plaintext")
        
        var password = key.aes_checksum(
            password_plaintext + secret_server_token
        )
        
        // When deleting then re-adding a brainkey this checksum
        // is used to ensure it is the correct brainkey.
        var brainkey_checksum = key.aes_checksum(
            brainkey_plaintext + secret_server_token
        ).checksum
        
        var brainkey_cipherhex = password.aes_private.encryptToHex(
            brainkey_plaintext
        )
        var promise = this.dispatch({
            public_name: wallet_public_name,
            password_checksum: password.checksum,
            encrypted_brainkey: brainkey_cipherhex,
            brainkey_checksum: brainkey_checksum
        });
        return new Promise((resolve, reject) => {
            ((wallet_public_name, password) => {
                promise.then(
                    result => {
                        if(unlock) {
                            aes_private_map[wallet_public_name] = password.aes_private
                        }
                        resolve()
                    }
                ).catch(error => reject(error))
            )(wallet_public_name, password)
        })
    }
    
    validatePassword(
        wallet,
        password,
        secret_server_token,
        unlock = false
    ) {
        if(! password || typeof password != 'string')
            throw new Error("required: password")
        
        if(! secret_server_token || typeof password != 'string')
            throw new Error("required: secret_server_token")
        
        var wallet = this.keys.get(wallet_public_name)
        if ( ! wallet)
            throw new Error("wrong password")
        
        var aes_private = key.aes_private(
            password + secret_server_token,
            wallet.password_checksum
        )
        if(unlock)
            aes_private_map[wallet_public_name] = aes_private
    }
    
    validateBrainkey(
        wallet
        brain_key,
        secret_server_token
    ) {
        if ( ! wallet)
            throw new Error("wrong password")
        
        if(! brain_key || typeof brain_key != 'string')
            throw new Error("required: brain_key")
        
        if(! secret_server_token || typeof password != 'string')
            throw new Error("required: secret_server_token")
        
        if ( ! wallet.brainkey_checksum)
            throw new Error("wrong password")
        
        var aes_private = key.aes_private(
            brain_key + secret_server_token,
            wallet.brainkey_checksum
        )
    }
    
    // delete_brainkey
    

}

module.exports = alt.createActions(PrivateKeyActions);
