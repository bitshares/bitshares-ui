import { Aes, PublicKey, PrivateKey, Signature, hash } from "@graphene/ecc"
import secureRandom from "secure-random"
import assert from "assert"
import lzma from "lzma"

/**
    @return {Promise} {Buffer} binary_backup
*/
export function encrypt(wallet_object, backup_pubkey) {
    // console.log("Backup.encrypt")
    return new Promise( resolve => {
        let compression_mode = 9 
        let entropy = secureRandom.randomBuffer(32)
        var public_key = toPublic(backup_pubkey)
        
        // The onetime private is never saved, only the onetime public
        var onetime_private_key = PrivateKey.fromBuffer(entropy)
        var walletString = JSON.stringify(wallet_object, null, 0)
        lzma.compress(walletString, compression_mode, compressedWalletBytes => {
            var backup_buffer =
                Aes.encrypt_with_checksum(onetime_private_key, public_key,
                    null/*nonce*/, compressedWalletBytes)
            
            var onetime_public_key = onetime_private_key.toPublicKey()
            var backup = Buffer.concat([ onetime_public_key.toBuffer(), backup_buffer ])
            resolve(backup)
        })
    })
}

/**
    @return {Promise} {object} wallet_object
*/
export function decrypt(backup_buffer, private_key) {
    // console.log("Backup.decrypt")
    
    if( ! Buffer.isBuffer(backup_buffer))
        backup_buffer = new Buffer(backup_buffer, 'binary')
    
    var public_key
    try {
        public_key = PublicKey.fromBuffer(backup_buffer.slice(0, 33))
        // console.log('backup public_key', public_key.toString())
        
    } catch(e) {
        console.error(e, "stack", e.stack)
        throw new Error("Invalid backup file")
    }
    
    backup_buffer = backup_buffer.slice(33)
    try {
        
        backup_buffer = Aes.decrypt_with_checksum(
            private_key, public_key, undefined/*nonce*/, backup_buffer)
        
    } catch(error) {
        if(/Invalid key/.test(error.toString()))
            throw new Error("invalid_auth")
        
        throw error
    }
    
    return new Promise( (resolve, reject) => {
        try {
            lzma.decompress(backup_buffer, wallet_string => {
                try {
                    var wallet_object = JSON.parse(wallet_string)
                    resolve(wallet_object)
                } catch(error) {
                    if( ! wallet_string) wallet_string = ""
                    console.error("Error parsing wallet json",
                        wallet_string.substring(0,10)+ "...")
                    reject("Error parsing wallet json")
                }
            })
        } catch(error) {
            console.error("Error decompressing wallet", error, error.stack)
            reject("Error decompressing wallet")
            return
        }
    })
}

let toPublic = data => data == null ? data :
    data.Q ? data : PublicKey.fromStringOrThrow(data)