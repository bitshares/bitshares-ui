import { checkToken, expire_min } from "@graphene/time-token"
import emailToken from "./EmailToken"
import * as WalletServerDb from "./WalletServerDb"
import {Wallet} from "./db/models.js"
import { hash } from "@graphene/ecc"

export default function reducer(state, action) {
    if( /redux/.test(action.type) ) return state
    // console_error("reducer\t", action.type)
    let { reply, walletNotify } = action
    try {
        switch( action.type ) {
            case 'requestCode':
                var { email } = action
                // Embed the sha1 of the email, this is required to limit 1 wallet per email
                let p = emailToken(email, email.trim().toLowerCase())
                p.on('close', (code, signal) =>{
                    if( code === 0 ) {
                        reply("OK", {expire_min: expire_min()})
                        return
                    }
                    console_error("emailToken\tcode, signal, email", code, signal, email)
                    reply("Internal Server Error", {code})
                })
                break
            case 'createWallet':
                var { code, encrypted_data, signature } = action
                let result = checkToken( code )
                if( ! result.valid ) {
                    reply("Unauthorized", {message: result.error})
                    break
                }
                let email = result.seed
                var email_sha1 = hash.sha1(email)
                reply( WalletServerDb.createWallet(encrypted_data, signature, email_sha1, wallet => walletNotify(wallet)) )
                break
            case 'fetchWallet':
                var { public_key, local_hash } = action
                var r = Wallet
                    .findOne({ where: {public_key} })
                    .then( wallet => {
                    
                    if( ! wallet ) return "No Content"
                    if( wallet.local_hash === local_hash ) return "Not Modified"
                    
                    return {
                        public_key,
                        local_hash: wallet.local_hash, // local_hash in fetch could be null, always return the wallet local hash
                        encrypted_data: wallet.encrypted_data.toString('base64'),
                        created: wallet.createdAt, updated: wallet.updatedAt
                    }
                })
                reply(r)
                break
            case 'saveWallet':
                var { original_local_hash, encrypted_data, signature } = action
                reply( WalletServerDb.saveWallet(original_local_hash, encrypted_data, signature,
                    wallet => walletNotify(wallet)) )
                break
            case 'changePassword':
                reply( WalletServerDb.changePassword(action, wallet => walletNotify(wallet)) )
                break
            case 'deleteWallet':
                reply( WalletServerDb.deleteWallet(action, wallet => walletNotify(wallet)) )
                break
            default:
                reply("Not Implemented")
        }
    } catch(error) {
        console_error('ERROR', action.type, error, error.stack)
        reply.badRequest(error)
    }
    return state
}

var console_error = (...message) =>{ console.error("ERROR reducer", ...message) }
