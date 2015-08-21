# zcrypto runs close to last, there are delays built-in

Aes = require '../src/ecc/aes'
PrivateKey = require '../src/ecc/key_private'
PublicKey = require '../src/ecc/key_public'
Signature = require '../src/ecc/signature'

Long = require('../src/common/bytebuffer').Long

secureRandom = require '../src/common/secureRandom'
assert = require 'assert'
hash = require '../src/common/hash'
key = require '../src/common/key_utils'
th = require './test_helper'

describe "crypto", ->
    
    it "sign fast", ->
        @timeout(10000)
        private_key = PrivateKey.fromSeed "1"
        for i in [0...10] by 1
            Signature.signBuffer (new Buffer i), private_key
    
    it "memo encryption", ->
        sender = PrivateKey.fromSeed "1"
        receiver = PrivateKey.fromSeed "2"
        S = sender.get_shared_secret receiver.toPublicKey()
        nonce = "289662526069530675"
        
        #console.log '... senderpriv',sender.toBuffer().toString 'hex'
        #console.log '... receiverpub',receiver.toPublicKey().toBuffer().toString 'hex'  
        #console.log '... S ecies',S.toString 'hex'
        
        ciphertext = Aes.encrypt_with_checksum(
            sender
            receiver.toPublicKey()
            nonce
            "Hello, world!"
        )
        #console.log '... ciphertext',ciphertext
        plaintext = Aes.decrypt_with_checksum(
            receiver
            sender.toPublicKey()
            nonce
            ciphertext
        )
        #console.log '... plaintext',plaintext.toString()
        assert.equal "Hello, world!", plaintext.toString()
        
    # time-based, probably want to keep these last
    it "key_checksum", ()->
        @timeout(1500)
        min_time_elapsed ()->
            key_checksum = key.aes_checksum("password").checksum
            assert.equal(
                true
                key_checksum.length > 4+4+2
                "key_checksum too short"
            )
            assert.equal 3, key_checksum.split(',').length
    
    it "key_checksum with aes_private", (done)->
        @timeout(1500)
        min_time_elapsed ()->
            aes_checksum = key.aes_checksum("password")
            aes_private = aes_checksum.aes_private
            key_checksum = aes_checksum.checksum
            assert aes_private isnt null
            assert typeof aes_private["decrypt"] is 'function'
            assert.equal(
                true
                key_checksum.length > 4+4+2
                "key_checksum too short"
            )
            assert.equal 3, key_checksum.split(',').length
            done()
        # DEBUG console.log('... key_checksum',key_checksum)
    
    it "wrong password", ->
        @timeout(2500)
        key_checksum = min_time_elapsed ()->
            key.aes_checksum("password").checksum
        # DEBUG console.log('... key_checksum',key_checksum)
        th.error "wrong password", ()->
            min_time_elapsed ()->
                key.aes_private "bad password", key_checksum
    
    it "password aes_private", ->
        @timeout(2500)
        key_checksum = min_time_elapsed ()->
            key.aes_checksum("password").checksum
        
        password_aes = min_time_elapsed ()->
            key.aes_private "password", key_checksum
        
        # DEBUG console.log('... password_aes',password_aes)
        assert password_aes isnt null
    
    it "suggest_brain_key", ->
        @timeout(1500)
        entropy = secureRandom.randomBuffer 32
        brainkey = min_time_elapsed ()->
            key.suggest_brain_key entropy.toString('binary')
        assert.equal 16, brainkey.split(' ').length

min_time_elapsed = (f)->
    start_t = Date.now()
    ret = f()
    elapsed = Date.now() - start_t
    assert.equal(
        # repeat operations may take less time
        elapsed >= 250 * .8, true
        "minimum time requirement was not met, instead only #{elapsed/1000.0} elapsed" 
    )
    ret

