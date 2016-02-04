import assert from "assert"
import { Map, List } from "immutable"
import { PublicKey, PrivateKey, hash } from "@graphene/ecc"
import { ChainStore } from "@graphene/chain"
import { Apis } from "@graphene/chain"

import LocalStoragePersistence from "../src/LocalStoragePersistence"

import WalletStorage from "../src/WalletStorage"
import ConfidentialWallet from "../src/ConfidentialWallet"

const username = "username"
const password = "password"
const email = "alice_spec@example.bitbucket"

// Configure to use localStorage for the purpose of these tests...
global.localStorage = require('localStorage')
const storage = new LocalStoragePersistence("wallet_spec")

let wallet, cw
let create = (name = "a1", brainkey = "brainkey", _cw = cw)=> _cw.createBlindAccount(name, brainkey)

function initWallet() {
    storage.clear()
    wallet = new WalletStorage(storage)
    cw = new ConfidentialWallet(wallet)
}

describe('Confidential wallet', () => {
    
    beforeEach(()=> initWallet())
    
    // Establish connection fully, obtain Chain ID
    before(()=> Apis.instance("ws://localhost:8090").init_promise)
    before(()=> ChainStore.init())
    
    // afterEach(()=> wallet.logout())

    it('keys', ()=> {
        
        wallet.login(username, password, email, Apis.chainId())
        
        let public_key = PrivateKey.fromSeed("").toPublicKey().toString()
        
        assert( cw.setKeyLabel( public_key, "label"), "add key and label")
        assert.equal( cw.getKeyLabel(public_key), "label" )
        
        assert( cw.setKeyLabel( public_key, "label2" ), "rename label")
        assert.equal( cw.getKeyLabel(public_key), "label2" )
        assert( ! cw.setKeyLabel( "public_key2", "label2"), "label already assigned")
        
        assert.equal( cw.getKeyLabel(public_key), "label2", "fetch label")
        assert.equal( cw.getPublicKey("label2"), public_key, "fetch key")
        
        {
            let key = PrivateKey.fromSeed("seed")
            assert( cw.setKeyLabel( key ), "add unlabeled private key")
            assert.equal(wallet.wallet_object
                .getIn( ["keys", key.toPublicKey().toString()] )
                .get("private_wif"), key.toWif())
            assert( cw.getPrivateKey( key.toPublicKey() ).d )
            assert( cw.getPrivateKey( key.toPublicKey().toString() ).d )
        }
        {
            let key = PrivateKey.fromSeed("seed2")
            let index_address = true
            assert( cw.setKeyLabel( key, "seed2 label", index_address, key.toPublicKey() ), "add labeled private key")
            assert.equal( cw.addressIndex.storage.state.size, 1, "expecting addresses");
            assert( cw.getPrivateKey( key.toPublicKey() ).d )
            assert( cw.getPrivateKey( key.toPublicKey().toString() ).d )
            assert( cw.getPrivateKey( "seed2 label" ).d )
            
        }
        
        assert( cw.getKeyLabel("") === null, "fetch label should return null")
        assert( cw.getPublicKey("") === null, "fetch key should return null")
    })
    
    it('accounts', ()=> {
        
        assert.throws(create, /login/, "This test should require an unlocked wallet" )
        
        // unlock
        wallet.login(username, password, email, Apis.chainId())
        
        assert.deepEqual( cw.getBlindAccounts().toJS(), {} )
        assert(create().Q, "Should return a public key")
        assert.throws(create, /label_exists/, "Expecting a 'label_exists' exception" )
        
        assert.deepEqual(
            cw.getBlindAccounts().toJS(),
            { "a1":  PrivateKey.fromSeed("brainkey").toPublicKey().toString() }
        )
        
        assert.deepEqual(
            cw.getMyBlindAccounts().toJS(),
            { "a1":  PrivateKey.fromSeed("brainkey").toPublicKey().toString() }
        )
        
        assert.equal(
            create("alice", "alice-brain-key").toString(),
            "GPH7vbxtK1WaZqXsiCHPcjVFBewVj8HFRd5Z5XZDpN6Pvb2dZcMqK",
            "Match against a known public key (matching the graphene cli wallet)"
        )
        assert.equal(
            create("bob", "bob-brain-key").toString(),
            "GPH8HosMbp7tL614bFgqtXXownHykqASxwmnH9NrhAnvtTuVWRf1X",
            "Match against a known public key (matching the graphene cli wallet)"
        )
        
    })
    
    it("account to blind transfers", function() {

        wallet.login(username, password, email, Apis.chainId())
        
        create("alice", "alice-brain-key", cw)
        create("bob", "bob-brain-key", cw)
        
        let key = PrivateKey.fromSeed("")
        cw.setKeyLabel( PrivateKey.fromSeed("nathan"), "nathan" )
        
        // must wait for a blocks...
        this.timeout(40 * 1000)

        return Promise.resolve()
        
            // single blind address
            .then( () => cw.transferToBlind( "nathan", "CORE", [["alice", 100]], true ))
            // .then( conf => assert.equal(conf.trx.operations[0][1].fee.amount, 15 * 100000, "fee") )
            // .then( tx => console.log(tx) )
            
            //     .then( () => cw.getBlindBalances("alice") )
            //     .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "100" + "00000" }) )
            // 
            // // two blind addresses
            // .then( () => cw.transferToBlind( "nathan", "CORE", [["alice",10], ["bob",10]], true ))
            // 
            //     .then( () => cw.getBlindBalances("alice") )
            //     .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "110" + "00000" }, "alice") )
            //     
            //     .then( () => cw.getBlindBalances("bob") )
            //     .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "10" + "00000" }, "bob") )
            // 
            // // blind to account
            // .then( ()=> cw.blindTransfer("alice", "nathan", 1, "CORE", true) )
            // .then( tx => assert.equal(tx.fee.amount, 15 * 100000, "fee") )
            //     
            //     // 110 - 15 fee - 1 === 94
            //     .then( () => cw.getBlindBalances("alice") )
            //     .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "94" + "00000" }, "alice") )
            // 
            // // blind to blind
            // .then( ()=> cw.blindTransfer("alice", "bob", 10, "CORE", true) )
            // .then( tx => assert.equal(tx.fee.amount, 15 * 100000, "fee") )
            //     
            //     // 94 - 15 fee - 1 === 78
            //     .then( () => cw.getBlindBalances("alice") )
            //     .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "69" + "00000" }, "alice") )
            // 
            //     .then( () => cw.getBlindBalances("bob") )
            //     .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "20" + "00000" }, "bob") )
            // 
            // // No change transaction (results in zero balance)
            // .then( ()=> cw.blindTransfer("bob", "alice", 5, "CORE", true) )
            // .then( tx => assert.equal(tx.fee.amount, 15 * 100000, "fee") )
            // 
            //     // 20 - 5 fee - 15 === 0
            //     .then( () => cw.getBlindBalances("bob") )
            //     .then( balances => assert.deepEqual(balances.toJS(), {}, "bob") )
            //     
            //     then( () => cw.getBlindBalances("alice") )
            //     .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "74" + "00000" }, "alice") )
            // 
            // blind to account
            .then( ()=> cw.transferFromBlind("alice", "nathan", 59, "CORE", true) )
            // .then( conf => assert.equal(conf.trx.operations[0][1].fee.amount, 15 * 100000, "fee") )
            
                .then( () => cw.getBlindBalances("alice") )
                .then( balances => assert.deepEqual(balances.toJS(), {}, "alice") )
                
            // Test blindHistory
            // .then( ()=> cw.blindHistory("alice") )
            // .then( receipts => assert(receipts.size, "alice receipt(s)") )
            //     
            // .then( ()=> cw.blindHistory("bob") )
            // .then( receipts => assert(receipts.size, "bob receipt(s)") )
            //     
            // .then( ()=> cw.blindHistory("nathan") )
            // .then( receipts => assert(receipts, "nathan receipt(s)") )
            
            // DEBUG, Print the entire Wallet Object
            // .then( ()=> console.log("INFO\twallet_object\t", JSON.stringify(cw.wallet.wallet_object, null, 4)) )
            
    })
    
    it("blind to blind transfer", function() {
    
        wallet.login(username, password, email, Apis.chainId())
        
        create("alice", "alice-brain-key", cw)
        create("bob", "bob-brain-key", cw)
        
        let key = PrivateKey.fromSeed("")
        cw.setKeyLabel( PrivateKey.fromSeed("nathan"), "nathan" )
        
        // must wait for a blocks...
        this.timeout(30 * 1000)
        
        return Promise.resolve()
            
            // do this just to get some money
            .then( () => cw.transferToBlind( "nathan", "CORE", [["alice",100]], true ))
            .then( tx => assert(tx.outputs, "tx.outputs") )
            
            .then( ()=> cw.blindTransfer("alice", "bob", 1, "CORE", true) )
            
            // .then( () => cw.getBlindBalances("bob") )
            // .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "1" + "00000" }) )
            
            // .then( res => console.log("work-in-progress result", res) )
        
    })
    
})