import assert from "assert"
import {createToken} from '@graphene/time-token'
import {Signature, PrivateKey, Aes, hash} from "@graphene/ecc"
import WalletWebSocket from "../src/WalletWebSocket"
import WalletApi from "../src/WalletApi"

const remote_url = process.env.npm_package_config_remote_url

const ws_rpc = new WalletWebSocket(remote_url)
const api = new WalletApi(ws_rpc)

// Run expensive calculations here so the benchmarks in the unit tests will be accurate
const private_key = PrivateKey.fromSeed("")
const public_key = private_key.toPublicKey().toString()
const code = createToken(hash.sha1("alice_api@example.bitbucket", 'binary'))
const encrypted_data = Aes.fromSeed("").encrypt("data")
const local_hash = hash.sha256(encrypted_data)
const signature = Signature.signBufferSha256(local_hash, private_key)

const private_key2 = PrivateKey.fromSeed("2")
const public_key2 = private_key2.toPublicKey().toString()
const encrypted_data2 = Aes.fromSeed("").encrypt("data2")
const local_hash2 = hash.sha256(encrypted_data2)
const signature2 = Signature.signBufferSha256(local_hash2, private_key2)
const signature_key1_enc2 = Signature.signBufferSha256(local_hash2, private_key)

console.log("WARN\ttest/wallet_api_spec.js tests depend on server state (run entire file)");

// This may be commented out because it spams the inbox...

// describe('Email API', () => {
//     
//     it('requestCode', function() {
//         this.timeout(5000)
//         let email = "alice@example.bitbucket"
//         return api.requestCode(email)
//     })
//     
// })

/** These test may depend on each other.  For example: createWallet is the setup for fetchWallet, etc...  */
describe('Wallet API client', () => {

    /** Ignore, this is clean up from a failed run */
    before( ()=> Promise
        .all([ deleteWallet("", "data"), deleteWallet("2", "data2") ])
        .catch(error =>{
            if(error.res.statusText !== "Not Found" && error.res.statusText !== "OK")
                throw error
        })
    )
    
    after(()=> ws_rpc.close())

    it('createWallet', ()=> {
        return api.createWallet(code, encrypted_data, signature)
    })

    it('createWallet (duplicate)', ()=> {
        // Ensure the same email can't be used twice.
        // Try to create a new wallet with the same code (email)
        return api.createWallet(code, encrypted_data2, signature2)
            .then( json =>{ asert(false, 'should not happen') })
            .catch( error =>{
                assert.equal(error.statusText, "Bad Request")
                assert.equal(error.message, "wallet already exists", error)
                assert(error.local_hash, "local_hash")
                assert(error.created, "created")
            })
    })

    it('fetchWallet (Recovery)', ()=> {
        let local_hash = null // recovery, the local_hash is not known
        return new Promise( resolve => {
            let fetch = api.fetchWallet(public_key, local_hash, json => {
                assertRes(json, "OK")
                assert(json.encrypted_data, encrypted_data.toString('base64'), 'encrypted_data')
                let unsub = api.fetchWalletUnsubscribe(public_key)
                resolve(Promise.all([ fetch, unsub ]))
            })
        })
    })

    it('fetchWallet (Not Modified)', ()=> {
        return new Promise( resolve => {
            let fetch = api.fetchWallet(public_key, local_hash, json => {
                assertRes(json, 'Not Modified')
                let unsub = api.fetchWalletUnsubscribe(public_key)
                resolve(Promise.all([ fetch, unsub ]))
            })
        })
    })
    
    it('fetchWallet (Not Exist)', ()=> {
        return new Promise( resolve => {
            let fetch = api.fetchWallet(public_key2, local_hash2, json => {
                assertRes(json, 'No Content')
                let unsub = api.fetchWalletUnsubscribe(public_key2)
                resolve(Promise.all([ fetch, unsub ]))
            })
        })
    })
    
    it('saveWallet', ()=> {
        return api.saveWallet( local_hash, encrypted_data2, signature_key1_enc2 ).then( json =>{
            assert.equal(json.local_hash, local_hash2.toString('base64'), 'local_hash')
            assert(json.updated, 'updated')
        })
    })

    it('saveWallet (Conflict)', ()=> {
        // original hash will not match
        return api.saveWallet( local_hash, encrypted_data2, signature_key1_enc2 )
            .then( json => assert.equal(json.statusText, "Conflict"))
    })
    
    it('saveWallet (Unknown key)', ()=> {
        // The "2" key is not on the api yet
        return api.saveWallet( local_hash2, encrypted_data2, signature2 )
            .then( json => assert.equal(json.statusText, "Not Found"))
    })
    
    it('changePassword', function() {
        this.timeout(2000)
        return api.changePassword( local_hash, signature, encrypted_data2, signature2 ).then( json => {
            assert.equal(json.local_hash, local_hash2.toString('base64'), 'local_hash did not match response: ' + json)
            assert(json.updated, 'updated')
        })
    })
    
    /** End of the wallet tests, clean-up... */
    it('deleteWallet', ()=>{
        return deleteWallet("2", "data2")
    })

})

function deleteWallet(private_key_seed, wallet_data) {
    let private_key = PrivateKey.fromSeed(private_key_seed)
    let encrypted_data = Aes.fromSeed(private_key_seed).encrypt(wallet_data)
    let local_hash = hash.sha256(encrypted_data)
    let signature = Signature.signBufferSha256(local_hash, private_key)
    return api.deleteWallet( local_hash, signature )
}

function assertRes(res, statusText) {
    assert.equal(res.statusText, statusText, res)
    return res
}