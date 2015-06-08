assert = require 'assert'
Long = require('../src/common/bytebuffer').Long

Aes = require '../src/ecc/aes'
PrivateKey = require '../src/ecc/key_private'
PublicKey = require '../src/ecc/key_public'
hash = require '../src/common/hash'

describe "crypto", ->
    
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
    
    it "decrypt a graphene memo", ->
        sender = PrivateKey.fromSeed "1"
        receiver = PrivateKey.fromSeed "2"
        S = sender.get_shared_secret receiver.toPublicKey()
        nonce = "2523449132308737096"
        cipherhex = "62f00737f603b6d822a189187747184fc533ae356c20c87ae19e32f8c01cac19"
        plaintext = Aes.decrypt_with_checksum(
            receiver
            sender.toPublicKey()
            nonce
            new Buffer cipherhex,'hex'
        )
        assert.equal "Hello, world!", plaintext.toString()
