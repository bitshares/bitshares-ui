import crypto from "crypto"
import {hash} from "@graphene/ecc"
import {Wallet} from "./db/models.js"
import {Signature, PrivateKey} from "@graphene/ecc"
import * as subscriptions from "./subscriptions"

/**
    @arg {string} encrypted_data - base64
    @arg {string} signature - base64
*/
export function createWallet(encrypted_data, signature, email_sha1, walletNotify) {
    encrypted_data = new Buffer(encrypted_data, 'base64')
    let signature_buffer = new Buffer(signature, 'base64')
    let sig = Signature.fromBuffer(signature_buffer)
    let lh = hash.sha256(encrypted_data)
    let pub = sig.recoverPublicKey(lh)
    if( ! sig.verifyHash(lh, pub))
        return Promise.reject("signature_verify")
    
    let public_key = pub.toString()
    email_sha1 = new Buffer(email_sha1, 'binary').toString('base64')

    return Wallet.findOne({ where: { $or:[{email_sha1},{public_key}] } }).then( wallet =>{
        let local_hash = lh.toString('base64')
        if( wallet )
            throw { message: 'duplicate', local_hash, created: wallet.createdAt }
        
        return Wallet.create({
            public_key, email_sha1, encrypted_data,
            signature: signature_buffer.toString('base64'), local_hash })
            // return only select fields from the wallet....
            // Do not return wallet.id, db sequences may change.
            .then( wallet =>{
                walletNotify({public_key, encrypted_data, local_hash,
                    created: wallet.createdAt, updated: wallet.updatedAt })
                return { local_hash, created: wallet.createdAt }
            })
    })
}

/**
    @arg {Buffer} encrypted_data - base64
    @arg {string} signature - base64
*/
export function saveWallet(original_local_hash, encrypted_data, signature, walletNotify) {
    // original_local_hash = new Buffer(original_local_hash, 'base64')
    encrypted_data = new Buffer(encrypted_data, 'base64')
    let sig = Signature.fromBuffer(new Buffer(signature, 'base64'))
    let lh = hash.sha256(encrypted_data)
    let pub = sig.recoverPublicKey(lh)
    if( ! sig.verifyHash(lh, pub))
        return Promise.reject("signature_verify")

    let public_key = pub.toString()
    let local_hash = lh.toString('base64')
    return Wallet.findOne({where: {public_key}}).then( wallet =>{
        if( ! wallet) return "Not Found"
        if(wallet.local_hash !== original_local_hash) return "Conflict"
        wallet.encrypted_data = encrypted_data
        wallet.local_hash = local_hash
        return wallet.save().then( wallet => {
            walletNotify({public_key, encrypted_data, local_hash,
                created: wallet.createdAt, updated: wallet.updatedAt })
            return { local_hash, updated: wallet.updatedAt }
        })
    })
}

export function changePassword({ original_local_hash, original_signature,
    new_encrypted_data, new_signature }, walletNotify) {
    new_encrypted_data = new Buffer(new_encrypted_data, 'base64')
    let original_pubkey
    {
        let sig = Signature.fromBuffer(new Buffer(original_signature, 'base64'))
        let local_hash = new Buffer(original_local_hash, 'base64')
        let public_key = sig.recoverPublicKey(local_hash)
        if( ! sig.verifyHash(local_hash, public_key))
            return Promise.reject("signature_verify (original)")
        original_pubkey = public_key.toString()
    }
    let new_local_hash, new_pubkey
    {
        let sig = Signature.fromBuffer(new Buffer(new_signature, 'base64'))
        let local_hash = hash.sha256(new_encrypted_data)
        let public_key = sig.recoverPublicKey(local_hash)
        if( ! sig.verifyHash(local_hash, public_key))
            return Promise.reject("signature_verify (new)")
        new_local_hash = local_hash.toString('base64')
        new_pubkey = public_key.toString()
    }
    return Wallet.findOne({where: {public_key: original_pubkey}}).then( wallet =>{
        if( ! wallet ) return "Not Found"
        wallet.encrypted_data = new_encrypted_data
        wallet.local_hash = new_local_hash
        wallet.public_key = new_pubkey
        return wallet.save().then( wallet => {
            
            // Tell any original wallet listeners the wallet is gone
            walletNotify({ public_key: original_pubkey, encrypted_data: null})
            
            return { local_hash: new_local_hash, updated: wallet.updatedAt }
        })
    })
}

export function deleteWallet({ local_hash, signature }, walletNotify) {
    local_hash = new Buffer(local_hash, 'base64')
    signature = new Buffer(signature, 'base64')
    let sig = Signature.fromBuffer(signature)
    let public_key = sig.recoverPublicKey(local_hash)
    
    if( ! sig.verifyHash(local_hash, public_key))
        return Promise.reject("signature_verify")
    
    public_key = public_key.toString()
    return Wallet.findOne({where: { public_key }}).then( wallet =>{
        if( ! wallet ) return "Not Found"
        return wallet.destroy().then( ()=>{
            
            // Tell any original wallet listeners the wallet is gone
            walletNotify({ public_key, encrypted_data: null})
            
            return "OK"
        })
    })
}

