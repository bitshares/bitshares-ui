import alt from "alt-instance"
import iDB from "idb-instance"

import lzma from "lzma"

import PrivateKey from 'ecc/key_private'
import PublicKey from 'ecc/key_public'
import Aes from 'ecc/aes'
import key from "common/key_utils"

import WalletActions from "actions/WalletActions"

class BackupActions {
    
    //backup() {
    //}
    
    //importwallet_object(wallet_object, walletName = "default") {
    //}
    //
    //createWalletBackup(backup_pubkey) {
    //}
    //
    //importWalletBackup(encryptedWalletBuffer, walletName = "default") {
    //    
    //}
    

}

var BackupActionsWrapped = alt.createActions(BackupActions)
export default BackupActionsWrapped

export function backup(backup_pubkey) {
    return new Promise( resolve => {
        resolve(createWalletObject().then( wallet_object => {
            var compression = 1
            return createWalletBackup(backup_pubkey, wallet_object, compression)
        }))
    })
}

export function restore(backup_wif, backup, wallet_name) {
    return new Promise( resolve => {
        resolve(decryptWalletBackup(backup_wif, backup).then( wallet_object => {
            //return iDB.restore(wallet_name, wallet_object)
            WalletActions.restore({wallet_name, wallet_object})
        }))
    })
}

export function createWalletObject() {
    return iDB.backup()
}

/**
 compression_mode can be 1-9 (1 is fast and pretty good; 9 is slower and probably much better)
*/
export function createWalletBackup(
    backup_pubkey, wallet_object, compression_mode, entropy) {
    return new Promise( resolve => {
        var public_key = PublicKey.fromPublicKeyString(backup_pubkey)
        var onetime_private_key = key.get_random_key(entropy)
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

export function decryptWalletBackup(backup_wif, backup_buffer) {
    return new Promise( (resolve, reject) => {
        if( ! Buffer.isBuffer(backup_buffer))
            backup_buffer = new Buffer(backup_buffer, 'binary')
        
        var private_key = PrivateKey.fromWif(backup_wif)
        var public_key
        try {
            public_key = PublicKey.fromBuffer(backup_buffer.slice(0, 33))
        } catch(e) {
            console.error(e, e.stack)
            throw new Error("Invalid backup file")
        }
        
        backup_buffer = backup_buffer.slice(33)
        try {
            backup_buffer = Aes.decrypt_with_checksum(
                private_key, public_key, null/*nonce*/, backup_buffer)
        } catch(error) {
            console.error("Error decrypting wallet", error, error.stack)
            reject("Error decrypting wallet")
            return
        }
        
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