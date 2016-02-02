import assert from "assert"
import { Map, List } from "immutable"
import { PublicKey, PrivateKey, hash } from "@graphene/ecc"
import { ChainStore } from "@graphene/chain"
import { Apis } from "@graphene/chain"

import LocalStoragePersistence from "../src/LocalStoragePersistence"
// import { is, fromJS } from "immutable"

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

    it('Keys', ()=> {
        
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
    
    it('Accounts', ()=> {
        
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
        this.timeout(30 * 1000)
        
        return Promise.resolve()
        
            // to single blind address
            .then( () => cw.transferToBlind( "nathan", "CORE", [["alice",100]], true ))
            .then( tx => assert(tx.outputs, "tx.outputs") )
            
            // to double blind addresses
            .then( () => cw.transferToBlind( "nathan", "CORE", [["alice",10], ["bob",1]], true ))
            .then( tx => assert(tx.outputs, "tx.outputs") )
            
            .then( () => cw.getBlindBalances("alice") )
            .then( balances => assert.deepEqual(balances.toJS(), { "1.3.0": "111" + "00000" }) )
            
            .then( ()=> cw.transferFromBlind("alice", "nathan", 1, "CORE", true) )
            .then( tx => assert(tx.outputs, "tx.outputs") )
            
            .then( ()=> cw.blindHistory("alice") )
            .then( receipts => assert(receipts.size > 0, "expecting receipt(s)") )
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
            
            .then( ()=> cw.blindTransfer("alice", "bob", 1, "CORE", false) )
            
            // .then( res => console.log("work-in-progress result", res) )
        
    })
    
    it("Crypto matches witness_node", ()=> {
        
        let one_time_private = PrivateKey.fromHex("8fdfdde486f696fd7c6313325e14d3ff0c34b6e2c390d1944cbfe150f4457168")
        let to_public = PublicKey.fromStringOrThrow("GPH7vbxtK1WaZqXsiCHPcjVFBewVj8HFRd5Z5XZDpN6Pvb2dZcMqK")
        let secret = one_time_private.get_shared_secret( to_public )
        let child = hash.sha256( secret )
        
        // Check everything above with `wdump((child));` from the witness_node:
        assert.equal(child.toString('hex'), "1f296fa48172d9af63ef3fb6da8e369e6cc33c1fb7c164207a3549b39e8ef698")
        
        let nonce = hash.sha256( one_time_private.toBuffer() )
        assert.equal(nonce.toString('hex'), "462f6c19ece033b5a3dba09f1e1d7935a5302e4d1eac0a84489cdc8339233fbf")
        
        
        return Apis
            .crypto("child", to_public.toHex(), child)
            .then( child_public => assert.equal(
                child_public,
                PublicKey.fromStringOrThrow("GPH6XA72XARQCain961PCJnXiKYdEMrndNGago2PV5bcUiVyzJ6iL").toHex())
            )
    })
        
    
})