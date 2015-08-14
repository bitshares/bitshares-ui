assert = require("assert")

Aes = require 'ecc/aes'
PrivateKey = require 'ecc/key_private'
PublicKey = require 'ecc/key_public'
Address = require 'ecc/address'


test = (key) ->
    describe "key_formats", ->
        
        it "Calcualtes public key from private key", ->
            private_key = PrivateKey.fromHex key.private_key
            public_key = private_key.toPublicKey()
            assert.equal key.public_key, public_key.toBtsPublic()

        it "Create BTS short address", ->
            public_key = PublicKey.fromBtsPublic key.public_key
            assert.equal key.bts_address, public_key.toBtsAddy() 

        it "Blockchain Address", ->
            public_key = PublicKey.fromBtsPublic key.public_key
            assert.equal key.blockchain_address, public_key.toBlockchainAddress().toString('hex')
            
        it "BTS public key import / export", ->
            public_key = PublicKey.fromBtsPublic key.public_key
            assert.equal key.public_key, public_key.toBtsPublic()

        it "PTS", ->
            private_key = PrivateKey.fromHex key.private_key
            public_key = private_key.toPublicKey()
            assert.equal key.pts_address, public_key.toPtsAddy()
        
        it "To WIF", ->
            private_key = PrivateKey.fromHex key.private_key
            assert.equal key.private_key_WIF_format, private_key.toWif()

        it "From WIF", ->
            private_key = PrivateKey.fromWif key.private_key_WIF_format
            assert.equal private_key.toHex(), key.private_key
            
        it "Calc public key", ->
            private_key = PrivateKey.fromHex key.private_key
            public_key = private_key.toPublicKey()
            assert.equal key.bts_address, public_key.toBtsAddy()
            
        it "Decrypt private key", ->
            aes = Aes.fromSeed "Password00"
            d = aes.decryptHex key.encrypted_private_key
            assert.equal key.private_key, d
        
            
        it "BTS/BTC uncompressed", ->
            public_key = PublicKey.fromBtsPublic key.public_key
            address = Address.fromPublic public_key, false, 0
            assert.equal key.Uncompressed_BTC, address.toString()
        
        it "BTS/BTC compressed", ->
            public_key = PublicKey.fromBtsPublic key.public_key
            address = Address.fromPublic public_key, true, 0
            assert.equal key.Compressed_BTC, address.toString()
        
        it "BTS/PTS uncompressed", ->
            public_key = PublicKey.fromBtsPublic key.public_key
            address = Address.fromPublic public_key, false, 56
            assert.equal key.Uncompressed_PTS, address.toString()
        
        it "BTS/PTS compressed", ->
            public_key = PublicKey.fromBtsPublic key.public_key
            address = Address.fromPublic public_key, true, 56
            assert.equal key.Compressed_PTS, address.toString()

test
    # delegate0
    # sourced from: ./bitshares/programs/utils/bts_create_key
    public_key: "GPH7jDPoMwyjVH5obFmqzFNp4Ffp7G2nvC7FKFkrMBpo7Sy4uq5Mj" 
    private_key: "20991828d456b389d0768ed7fb69bf26b9bb87208dd699ef49f10481c20d3e18"
    private_key_WIF_format: "5J4eFhjREJA7hKG6KcvHofHMXyGQZCDpQE463PAaKo9xXY6UDPq"
    bts_address: "GPH8DvGQqzbgCR5FHiNsFf8kotEXr8VKD3mR"
    pts_address: "Po3mqkgMzBL4F1VXJArwQxeWf3fWEpxUf3"
    encrypted_private_key: "5e1ae410919c450dce1c476ae3ed3e5fe779ad248081d85b3dcf2888e698744d0a4b60efb7e854453bec3f6883bcbd1d"
    blockchain_address: "4f3a560442a05e4fbb257e8dc5859b736306bace"
    # https://github.com/BitShares/bitshares/blob/2602504998dcd63788e106260895769697f62b07/libraries/wallet/wallet_db.cpp#L103-L108
    Uncompressed_BTC:	"GPHLAFmEtM8as1mbmjVcj5dphLdPguXquimn"
    Compressed_BTC:	"GPHANNTSEaUviJgWLzJBersPmyFZBY4jJETY"
    Uncompressed_PTS:	"GPHEgj7RM6FBwSoccGaESJLC3Mi18785bM3T"
    Compressed_PTS:	"GPHD5rYtofD6D4UHJH6mo953P5wpBfMhdMEi"

