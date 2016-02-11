import assert from "assert"
import { Map, List } from "immutable"
import { PublicKey, PrivateKey, hash } from "@graphene/ecc"
import { ChainStore } from "@graphene/chain"
import { Apis } from "@graphene/chain"

import LocalStoragePersistence from "../src/LocalStoragePersistence"

// import AddressIndex from "../src/AddressIndex"
import WalletStorage from "../src/WalletStorage"
import ConfidentialWallet from "../src/ConfidentialWallet"

const username = "username"
const password = "password"
const email = "alice_spec@example.bitbucket"
const storage = new LocalStoragePersistence("cwallet_spec", false/*save*/)

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
            assert( cw.setKeyLabel( key, "seed2 label", key.toPublicKey() ), "add labeled private key")
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
    
    it("account to blind", function() {
    
        wallet.login(username, password, email, Apis.chainId())
        
        create("alice", "alice-brain-key", cw)
        create("bob", "bob-brain-key", cw)
        
        cw.setKeyLabel( PrivateKey.fromSeed("nathan"), "@nathan" )
        
        // must wait for a blocks...
        this.timeout(10 * 1000)
    
        return Promise.resolve()
        
        // single blind address
        .then( () => cw.transferToBlind( "nathan", "CORE", [["alice", 100]], true ))
        .then( tx => assert.equal(tx.confirmation_receipts.length, 1, "confirmation_receipts"))
        
            .then( () => cw.getBlindBalances("alice") )
            .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "100" + "00000" }) )
        
        // two blind addresses
        .then( () => cw.transferToBlind( "nathan", "CORE", [["alice",10], ["bob",10]], true ))
        .then( tx => assert.equal(tx.confirmation_receipts.length, 2, "confirmation_receipts"))
        
            .then( () => cw.getBlindBalances("alice") )
            .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "110" + "00000" }, "alice") )
            
            .then( () => cw.getBlindBalances("bob") )
            .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "10" + "00000" }, "bob") )
        
        // blindHistory
        .then( ()=> cw.blindHistory("alice") )
        .then( receipts => assert.equal(receipts.size, 2, "alice receipt(s)") )
            
        // blindHistory
        .then( ()=> cw.blindHistory("bob") )
        .then( receipts => assert.equal(receipts.size, 1, "bob receipt(s)") )
            
        // DEBUG, Print the entire Wallet Object
        // .then( ()=> console.log("INFO\twallet_object\t", JSON.stringify(cw.wallet.wallet_object, null, 4)) )
        
    })
    
    it("blind to account", function() {
    
        wallet.login(username, password, email, Apis.chainId())
        
        create("alice", "alice-brain-key", cw)
        cw.setKeyLabel( PrivateKey.fromSeed("nathan"), "@nathan" )
        
        // must wait for a blocks...
        this.timeout(40 * 1000)
        let tx
        
        return Promise.resolve()
        
        // single blind address (for preparation)
        .then( () => cw.transferToBlind( "nathan", "CORE", [["alice", 60]], true ))
        
            .then( () => cw.getBlindBalances("alice") )
            .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "60" + "00000" }) )
        
        // blind to account (with change)
        .then( ()=> cw.transferFromBlind("alice", "nathan", 10, "CORE", true) ).then(t => tx = t)
        .then( ()=> assert( ! tx.confirmation_receipt, "confirmation_receipt"))
        .then( ()=> assert( tx.change_receipt, "change_receipt"))
        // .then( tx => assert.equal(tx.fee.amount, 15 * 100000, "fee") )// FIXME fee should be 20
            
            .then( () => cw.getBlindBalances("alice") )
            .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "30" + "00000" }, "alice") )
        
        // blind to account (without change)
        .then( ()=> cw.transferFromBlind("alice", "nathan", 10, "CORE", true) ).then(t => tx = t)
        .then( ()=> assert( ! tx.confirmation_receipt, "confirmation_receipt"))
        .then( ()=> assert( ! tx.change_receipt, "change_receipt"))
        // .then( tx => assert.equal(tx.fee.amount, 15 * 100000, "fee") )// FIXME fee should be 20
            
            .then( () => cw.getBlindBalances("alice") )
            .then( balances => assert.deepEqual(balances.toJS(), {}, "alice") )
    })
    
    
    it("blind to blind", function() {
    
        wallet.login(username, password, email, Apis.chainId())
        
        create("alice", "alice-brain-key", cw)
        create("bob", "bob-brain-key", cw)
        
        cw.setKeyLabel( PrivateKey.fromSeed("nathan"), "@nathan" )
        
        // must wait for a blocks...
        this.timeout(30 * 1000)
        
        let tx
        
        return Promise.resolve()
            
        // do this just to get some money
        .then( () => cw.transferToBlind( "nathan", "CORE", [["alice",40]], true ))
        .then( tx => assert(tx.outputs, "tx.outputs") )
        
        // blind to blind (with change)
        .then( ()=> cw.blindTransfer("alice", "bob", 5, "CORE", true) ).then(t => tx = t)
        .then( ()=> assert.equal(tx.fee.amount, 15 * 100000, "fee") )
        .then( ()=> assert(tx.confirmation_receipt, "confirmation_receipt"))
        .then( ()=> assert(tx.change_receipt, "change_receipt"))
        
            .then( () => cw.getBlindBalances("alice") )
            .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "20" + "00000" }) )
        
            .then( () => cw.getBlindBalances("bob") )
            .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "5" + "00000" }) )
        
        // blind to blind (without change)
        .then( ()=> cw.blindTransfer("alice", "bob", 5, "CORE", true) ).then(t => tx = t)
        .then( ()=> assert.equal(tx.fee.amount, 15 * 100000, "fee") )
        .then( ()=> assert(tx.confirmation_receipt, "confirmation_receipt"))
        .then( ()=> assert( ! tx.change_receipt, "change_receipt"))
        
            .then( () => cw.getBlindBalances("alice") )
            .then( balances => assert.deepEqual(balances.toJS(), {}) )
        
            .then( () => cw.getBlindBalances("bob") )
            .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "10" + "00000" }) )
    })
    
})