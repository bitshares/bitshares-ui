import alt from "alt-instance"
import iDB from "idb-instance"

import lzma from "lzma"

import PrivateKey from 'ecc/key_private'
import PublicKey from 'ecc/key_public'
import Aes from 'ecc/aes'
import key from "common/key_utils"

class BackupActions {
    
    //exportwallet_object() {
    //    createWalletObject().then( wallet_object => {
    //        this.dispatch(wallet_object)
    //    })
    //}
    //
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

export function createWalletObject() {
    return iDB.backup().then( bak => {
            var wallet = bak.wallet[0]
        var private_keys = bak.private_keys
        var linked_accounts = []
        for(let linked_account of bak.linked_accounts) {
            linked_accounts.push(linked_account.name)
        }
        return { wallet, private_keys, linked_accounts }
    })
}

/**
 compression_mode can be 1-9 (1 is fast and pretty good; 9 is slower and probably much better)
*/
export function createWalletBackup(backup_pubkey, wallet_object,
    compression_mode, entropy) {
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
    return new Promise( resolve => {
        var private_key = PrivateKey.fromWif(backup_wif)
        var public_key = PublicKey.fromBuffer(backup_buffer.slice(0, 33))
        
        backup_buffer = backup_buffer.slice(33)
        backup_buffer = Aes.decrypt_with_checksum(private_key, public_key,
            null/*nonce*/, backup_buffer)
        lzma.decompress(new Buffer(backup_buffer, 'binary'), backup => {
            resolve(JSON.parse(backup))
        })
    })
}