import alt from "alt-instance";
import iDB from "idb-instance";
import {compress, decompress} from "lzma";
import {PrivateKey, PublicKey, Aes, key} from "graphenejs-lib";
import WalletActions from "actions/WalletActions";

class BackupActions {

    incommingWebFile(file) {
        return (dispatch) => {
            let reader = new FileReader();
            reader.onload = evt => {
                let contents = new Buffer(evt.target.result, "binary");
                let name = file.name;
                let last_modified = file.lastModifiedDate.toString();

                dispatch({name, contents, last_modified});
            };
            reader.readAsBinaryString(file);
        };
    }

    incommingBuffer(params) {
        return params;
    }

    reset() {
        return true;
    }

}

let BackupActionsWrapped = alt.createActions(BackupActions);
export default BackupActionsWrapped;

export function backup(backup_pubkey) {
    return new Promise( resolve => {
        resolve(createWalletObject().then( wallet_object => {
            let compression = 1;
            return createWalletBackup(backup_pubkey, wallet_object, compression);
        }));
    });
}

/** No click backup.. Works great, but not used (yet?) */
// export function backupToBin(
//     backup_pubkey = WalletDb.getWallet().password_pubkey,
//     saveAsCallback = saveAs
// ) {
//     backup(backup_pubkey).then( contents => {
//         let name = iDB.getCurrentWalletName() + ".bin"
//         let blob = new Blob([ contents ], {
//             type: "application/octet-stream; charset=us-ascii"})
//
//         if(blob.size !== contents.length)
//             throw new Error("Invalid backup to download conversion")
//
//         saveAsCallback(blob, name);
//         WalletActions.setBackupDate()
//     })
// }

export function restore(backup_wif, backup, wallet_name) {
    return new Promise( resolve => {
        resolve(decryptWalletBackup(backup_wif, backup).then( wallet_object => {
            return WalletActions.restore(wallet_name, wallet_object);
        }));
    });
}

export function createWalletObject() {
    return iDB.backup();
}

/**
 compression_mode can be 1-9 (1 is fast and pretty good; 9 is slower and probably much better)
*/
export function createWalletBackup(
    backup_pubkey, wallet_object, compression_mode, entropy) {
    return new Promise( resolve => {
        let public_key = PublicKey.fromPublicKeyString(backup_pubkey);
        let onetime_private_key = key.get_random_key(entropy);
        let walletString = JSON.stringify(wallet_object, null, 0);
        compress(walletString, compression_mode, compressedWalletBytes => {
            let backup_buffer =
                Aes.encrypt_with_checksum(onetime_private_key, public_key,
                    null/*nonce*/, compressedWalletBytes);

            let onetime_public_key = onetime_private_key.toPublicKey();
            let backup = Buffer.concat([ onetime_public_key.toBuffer(), backup_buffer ]);
            resolve(backup);
        });
    });
}

export function decryptWalletBackup(backup_wif, backup_buffer) {
    return new Promise( (resolve, reject) => {
        if( ! Buffer.isBuffer(backup_buffer))
            backup_buffer = new Buffer(backup_buffer, "binary");

        let private_key = PrivateKey.fromWif(backup_wif);
        let public_key;
        try {
            public_key = PublicKey.fromBuffer(backup_buffer.slice(0, 33));
        } catch(e) {
            console.error(e, e.stack);
            throw new Error("Invalid backup file");
        }

        backup_buffer = backup_buffer.slice(33);
        try {
            backup_buffer = Aes.decrypt_with_checksum(
                private_key, public_key, null/*nonce*/, backup_buffer);
        } catch(error) {
            console.error("Error decrypting wallet", error, error.stack);
            reject("invalid_decryption_key");
            return;
        }

        try {
            decompress(backup_buffer, wallet_string => {
                try {
                    let wallet_object = JSON.parse(wallet_string);
                    resolve(wallet_object);
                } catch(error) {
                    if( ! wallet_string) wallet_string = "";
                    console.error("Error parsing wallet json",
                        wallet_string.substring(0,10)+ "...");
                    reject("Error parsing wallet json");
                }
            });
        } catch(error) {
            console.error("Error decompressing wallet", error, error.stack);
            reject("Error decompressing wallet");
            return;
        }
    });
}
