import assert from "assert"
import { Map, is } from "immutable"
import { encrypt, decrypt } from "../src/Backup"
import {createToken} from '@graphene/time-token'
import {Signature, PrivateKey, Aes, hash} from "@graphene/ecc"
import LocalStoragePersistence from "../src/LocalStoragePersistence"
import WalletStorage from "../src/WalletStorage"
import WalletWebSocket from "../src/WalletWebSocket"
import WalletApi from "../src/WalletApi"

const chain_id = "abcdef"
const username = "username"
const password = "password"
const email = "alice_spec@example.bitbucket"
const remote_url = process.env.npm_package_config_remote_url

const storage = ()=> new LocalStoragePersistence("wallet_spec", false/*save*/).clear()
const code = (e = email) => createToken(hash.sha1(e, 'binary'))

const localWallet = ()=> {
    let storage = new LocalStoragePersistence("wallet_spec", false/*save*/)
    storage.clear() // Clearing memory (ignore disk contents)
    return new WalletStorage(storage)
}
const remoteWallet = (e = email, remote_copy = true)=> {
    let wallet
    return Promise.resolve()
    .then(()=> wallet = localWallet())
    .then(()=> wallet.useBackupServer(remote_url))
    .then(()=> wallet.login(e, username, password, chain_id) )
    .then(()=> wallet.keepRemoteCopy(true, remote_copy ? code(e) : undefined) )
    .then(()=> wallet )
}

describe('Single wallet', () => {
    
    let wallet

    // Ensure there is no wallet on the server
    beforeEach(()=> Promise.resolve()
        .then(()=> wallet = localWallet())
        .then(()=> wallet.useBackupServer(remote_url))
        .then(()=> wallet.keepRemoteCopy(false))//delete
        .then(()=> wallet.login(email, username, password, chain_id) )//delete
        .then(()=> wallet.logout())
        .then(()=> wallet = localWallet())
        // .catch( error=>{ console.error("wallet_spec\tbeforeEach", error.stack); throw error })
    )
    

    afterEach(()=> wallet ? wallet.logout() : null)

    it("login then sync", ()=> {
        
        return Promise.resolve()
        .then(()=> wallet.useBackupServer(remote_url) )
        .then(()=> wallet.login(email, username, password, chain_id) )
        .then(()=> wallet.keepRemoteCopy(true, code()) )
        .then(()=> assert(wallet.storage.state.has("remote_hash"), "remote_hash") )
    })
    
    it('server', ()=> {
        
        wallet.useBackupServer(remote_url)
        
        return Promise.resolve() // create a wallet
        .then( ()=> wallet.login(email, username, password, chain_id))
        .then( ()=> wallet.keepRemoteCopy(true, code()))
        .then( ()=> wallet.setState({ test_wallet: 'secret'}))
        
        // Wallet is in memory
        .then( ()=> assert.equal(wallet.wallet_object.get("test_wallet"), "secret"))
        
        // Wallet is on the server
        .then( ()=> assertServerWallet('secret', wallet))
    })
    
    it('disk', ()=> {
        
        // Create a local wallet
        wallet.keepLocalCopy(true)
        
        return Promise.resolve() // create a wallet
        .then( ()=> wallet.login(email, username, password, chain_id))
        .then( ()=> wallet.setState({ test_wallet: 'secret'}))
        
        // Wallet is in memory
        .then( ()=>{ assert.equal(wallet.wallet_object.get("test_wallet"), "secret") })
        
        // Verify the disk wallet exists
        .then( ()=>{
            let testStorage = new LocalStoragePersistence("wallet_spec", false/*save*/)
            let json = testStorage.getState().toJS()
            assert(json.remote_hash == null, 'remote_hash')
            assert(json.encrypted_wallet,'encrypted_wallet')
            // assert(json.private_encryption_pubkey,'private_encryption_pubkey')
            wallet.keepLocalCopy(false)// clean-up (delete it from disk)
        })
        
        // It is not on the server
        .then( ()=> assertNoServerWallet(wallet) )
    })
    
    it('memory', ()=> {
        
        // keepLocalCopy false will also delete anything on disk
        wallet.keepLocalCopy(false)
        
        return Promise.resolve() // create a wallet
        .then( ()=> wallet.login(email, username, password, chain_id))
        .then( ()=> wallet.setState({ test_wallet: 'secret'}))
        
        // Wallet is in memory
        .then( ()=>{ assert.equal(wallet.wallet_object.get("test_wallet"), "secret") })
        
        // It is not on disk
        .then( ()=>{
            let testStorage = new LocalStoragePersistence("wallet_spec", false/*save*/)
            let json = testStorage.getState().toJS()
            assert.equal("{}", JSON.stringify(json), "disk was not empty")
        })
        
        // It is not on the server
        .then( ()=> assertNoServerWallet(wallet) )
    })
    
    it("password", function() {
        
        this.timeout(5000)
        wallet.useBackupServer(remote_url)
        
        return Promise.resolve()
        .then( ()=> wallet.login(email, username, password, chain_id) )
        .then( ()=> wallet.keepRemoteCopy(true, code()) )
        
        .then( ()=>{ assert.throws(()=> wallet.changePassword("invalid_"+password, "new_"+password), /invalid_password/, "invalid_password") })
        
        // Trigger a wallet modified exception.
        // Unsubscribe and disconnect, then modify locally only
        .then( ()=>{ wallet.useBackupServer(null) })
        .then( ()=> wallet.setState({ test_wallet: 'two' }) )
        .then( ()=>{ assert.throws(()=> wallet.changePassword(password, "new_"+password), /wallet_modified/, "wallet_modified") })
        
        // Recover from the wallet_modified exception
        .then( ()=> wallet.logout() )
        .then( ()=>{
            // reset the wallet so it will download the wallet (original remote_hash must match)
            wallet = localWallet()
            wallet.useBackupServer(remote_url)
        })
        .then( ()=> wallet.login(email, username, password, chain_id) )
        
        // now the wallet is not modified, the local copy matches the server
        .then( ()=> wallet.changePassword(password, "new_"+password) )
        .then( ()=> wallet.logout() )
        .then( ()=> wallet.login(email, username, "new_"+password, chain_id) )
    })
    
    it('server offline updates', ()=> {
        
        wallet.useBackupServer(remote_url)
        
        let create = wallet.login(email, username, password, chain_id)
            // create the initial wallet
            .then(()=> wallet.keepRemoteCopy(true, code()) )
            .then(()=> wallet.setState({ test_wallet: 'secret'}) )
        
        return create.then(()=>{
            
            // disconnect from the backup server
            wallet.useBackupServer(null)
            
            // does not delete wallet on the server (it was disconnect above)
            wallet.keepRemoteCopy(false)
            
            return assertServerWallet('secret', wallet)//still on server
                .then(()=> wallet.setState({ test_wallet: 'offline secret'}))//local change
                .then(()=> wallet.setState({ test_wallet: 'offline secret2'}))//local change
                .then(()=>{
                
                // the old wallet is still on the server
                return assertServerWallet('secret', wallet)//server unchanged
                    .then(()=>{
                    
                    wallet.useBackupServer(remote_url)//configure to hookup again
                    
                    // there were 2 updates, now sync remotely
                    return wallet.keepRemoteCopy(true)//backup to server
                        .then(()=>{
                        
                        // New wallet is on the server
                        return assertServerWallet('offline secret2', wallet)
                    })
                })
            })
        })
    })
})

describe('Multi wallet', () => {
    
    beforeEach(()=>{
        // delete the test wallet
        return remoteWallet().then( wallet => {
            return wallet.keepRemoteCopy(false) // delete
                .then(()=> wallet.logout())
                .catch( error=>{ console.error("wallet_spec\tMulti Wallet beforeEach", error); throw error })
        })
    })
    
    it('synchronizes', function() {
        this.timeout(4000)
        let w1, w2
        return Promise.resolve()
        .then( ()=> remoteWallet()).then(w => w1 = w)
        .then( ()=> remoteWallet()).then(w => w2 = w)
        
        .then( ()=> w1.setState({ test_wallet: "1" }) )
        .then( ()=> w2.getState()).then(w => assert.equal(w.get("test_wallet"), "1") )
        .then( ()=> w1.getState()).then(w => assert.equal(w.get("test_wallet"), "1") )
        .then( ()=> assert.deepEqual(w1.localHash().toString("base64"), w2.localHash().toString("base64")) )
        
        .then( ()=> w2.setState({ test_wallet: "2" }) )
        // .then( ()=> w1.getState()).then(w => console.log(w.toJS()) )
        .then( ()=> w1.getState()).then(w => assert.equal(w.get("test_wallet"), "2") )
        
    })
    
    it('server conflict', function() {
        this.timeout(4000)
        return remoteWallet().then( wallet1 => {
            return wallet1.setState({ test_wallet: ''})
                // create a second wallet client (same email, same server wallet)
                .then(()=> remoteWallet()).then( wallet2 => {
                
                // bring both clients offline
                wallet1.useBackupServer(null)
                wallet2.useBackupServer(null)
                
                return wallet1.setState({ test_wallet: 'secret' })
                    .then(()=> wallet2.setState({ test_wallet: 'secret2' }))
                    .then(()=> wallet1.useBackupServer(remote_url))
                    .then(()=> wallet2.useBackupServer(remote_url))
                    .then(()=> {
                    
                    // bring clients online
                    wallet1.useBackupServer(remote_url)
                    wallet2.useBackupServer(remote_url)
                    
                    // 1st one to update wins
                    return wallet1.getState().then( wallet_object => {
                        
                        // Be sure the wallet synced up
                        assert.equal(wallet_object.get("test_wallet"), 'secret')
                        assert.equal(wallet1.wallet_object.get("test_wallet"), 'secret')
                        
                        // Cause a conflict updating 2nd client
                        return wallet2.getState()
                        .then( ()=> assert(false, '2nd client should not update'))
                        .catch( error => {
                            
                            assert.equal(wallet2.remote_status, "Conflict")
                            assert(/Conflict/.test(error.toString()), 'Expecting conflict ' + error)
                            // still the same before the conflict
                            assert.equal(wallet2.wallet_object.get("test_wallet"), 'secret2')
                            
                        })
                        
                    })
                }).then(()=> wallet2.logout())
            }).then(()=> wallet1.logout())
        })
    })
    
    
    /** Make updates to the same wallet back and forth across websockets (represents two devices). */
    it('server subscription update', function() {
        this.timeout(4000)
        return new Promise( (resolve, reject) => {
            
            // Create two remote wallets, same wallet but different connections (different devices).
            // The wallets have to be created serially so the second wallet will see the first wallet
            let wallet1, wallet2
            let main = Promise.resolve()
            .then( ()=> remoteWallet()).then( w1 => wallet1 = w1)
            .then( ()=> remoteWallet()).then( w2 => wallet2 = w2)
            .then( ()=>{
                
                let p1 = new Promise( r1 =>{
                    let p2 = new Promise( r2 =>{
                        
                        let s1 = assertSubscribe("secret", 1)
                        let s2 = assertSubscribe("secret", 2)
                        
                        wallet1.subscribe( s1, r1 )
                        wallet2.subscribe( s2, r2 )
                        
                        wallet1.setState({ test_wallet: 'secret' })
                        
                        // p1, p2 will check the wallets during the subscribe events
                        .then(()=>Promise.all([ p1, p2 ])) 
                        
                        .then(()=>{
                            
                            wallet1.unsubscribe( s1 )
                            wallet2.unsubscribe( s2 )
                            
                            let p3 = new Promise( r3 =>{
                                let p4 = new Promise( r4 =>{
                                    
                                    let s3 = assertSubscribe("secretB", 3)
                                    let s4 = assertSubscribe("secretB", 4)
                                    
                                    wallet1.subscribe( s3, r3 )
                                    wallet2.subscribe( s4, r4 )
                                    
                                    wallet2.setState({ test_wallet: 'secretB' }).then(()=>Promise.all([ p3, p4 ]))
                                    .then(()=>{
                                        wallet1.unsubscribe( s3 )
                                        wallet2.unsubscribe( s4 )
                                        
                                        // resolve( Promise.all([ wallet1.logout(), wallet2.logout() ]))
                                        resolve()
                                    
                                    }).catch( error => reject(error))
                                    
                                })
                            })
                            
                        }).catch( error => reject(error))
                        
                    })
                })
                
            })
            main.catch( error => reject(error))
        })
    })
})

let assertSubscribe = (expected, label) => wallet =>{
    // console.log("assertWalletEqual",label, expected)
    assert(wallet, 'wallet ' + label)
    assert(wallet.wallet_object, 'wallet_object ' + label)
    let got = wallet.wallet_object.get("test_wallet")
    assert.equal(got, expected, `${label}: expected "${expected}", got "${got}"`)
}

function assertNoServerWallet(walletParam) {
    if( ! walletParam.private_key ) throw new Error("wallet locked")
    let ws_rpc = new WalletWebSocket(remote_url)
    let api = new WalletApi(ws_rpc)
    let p1 = new Promise( (resolve, reject) => {
        let public_key = walletParam.private_key.toPublicKey()
        let p2 = api.fetchWallet( public_key, null, json => {
            try {
                assert.equal(json.statusText, "No Content")
            } catch( error ) {
                reject( error )
            }
        }).catch( error => reject(error))
        resolve(p2.then(()=> api.fetchWalletUnsubscribe(public_key)))
    })
    return p1.then(()=> ws_rpc.close())
}

function assertServerWallet(test_wallet, walletParam) {
    
    if( ! walletParam.private_key ) throw new Error("wallet locked")
    
    let ws_rpc = new WalletWebSocket(remote_url)
    let api = new WalletApi(ws_rpc)
    let p1 = new Promise( (resolve, reject) => {
        let public_key = walletParam.private_key.toPublicKey()
        let p2 = api.fetchWallet( public_key, null, json => {
            try {
                assert(json.encrypted_data, 'No Server Wallet')
                let backup_buffer = new Buffer(json.encrypted_data, 'base64')
                let p3 = decrypt(backup_buffer, walletParam.private_key).then( wallet_object => {
                    assert.equal( test_wallet, wallet_object.test_wallet )
                })
                let p4 = api.fetchWalletUnsubscribe(public_key)
                resolve(Promise.all([ p3, p4 ]))
            } catch( error ) {
                reject( error )
            }
        }).catch( error => reject(error))
    })
    return p1.then(()=> ws_rpc.close())
}
