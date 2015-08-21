ecdsa = require './ecdsa'
hash = require '../common/hash'
curve = require('ecurve').getCurveByName 'secp256k1'
assert = require 'assert'
BigInteger = require 'bigi'
PublicKey = require './key_public'

class Signature

    constructor: (@r, @s, @i) ->
        assert.equal @r isnt null, true, 'Missing parameter'
        assert.equal @s isnt null, true, 'Missing parameter'
        assert.equal @i isnt null, true, 'Missing parameter'

    Signature.fromBuffer = (buf) ->
        assert.equal buf.length, 65, 'Invalid signature length'
        
        i = buf.readUInt8(0)
        
        # At most 3 bits (bitcoinjs-lib, ecsignature.js::parseCompact)
        assert.equal i - 27, i - 27 & 7, 'Invalid signature parameter'
        
        #compressed = !!(i & 4)
        
        r = BigInteger.fromBuffer buf.slice 1, 33
        s = BigInteger.fromBuffer buf.slice 33
        new Signature r, s, i

    toBuffer: () ->
        buf = new Buffer 65
        buf.writeUInt8(@i, 0)
        @r.toBuffer(32).copy buf, 1
        @s.toBuffer(32).copy buf, 33
        buf
        
    recoverPublicKeyFromBuffer: (buffer) ->
        @recoverPublicKey hash.sha256 buffer
        
    recoverPublicKey: (sha256_buffer) ->
        e = BigInteger.fromBuffer(sha256_buffer)
        i = @i
        i = i & 3 # Recovery param only
        Q = ecdsa.recoverPubKey(curve, e, this, i)
        PublicKey.fromPoint Q
        
    ###
    @param {Buffer}
    @param {./PrivateKey}
    @param {./PublicKey} optional for performance
    @return {./Signature}
    ###
    Signature.signBuffer = (buf, private_key, public_key) ->
        i = null
        nonce = 0
        _hash = hash.sha256 buf
        e = BigInteger.fromBuffer(_hash)
        while true
            ecsignature = ecdsa.sign curve, _hash, private_key.d, nonce++
            der = ecsignature.toDER()
            lenR = der[3]
            lenS = der[5+lenR]
            #console.log 'len r',lenR, 'len s',lenS
            if lenR is 32 and lenS is 32 # canonical
                i = ecdsa.calcPubKeyRecoveryParam curve, e, ecsignature, private_key.toPublicKey().Q
                i += 4 #compressed
                i += 27 #compact
                break
            
            # signing is slow, keep an eye out for this...
            if nonce % 10 == 0
                console.log "WARN: #{nonce} attempts to find canonical signature"
        
        new Signature ecsignature.r, ecsignature.s, i
    
    Signature.sign = (string, private_key)->
        Signature.signBuffer new Buffer(string), private_key
    
    ###*
    @param {Buffer} un-hashed
    @param {./PublicKey}
    @return {boolean}
    ###
    verifyBuffer: (buf, public_key) ->
        _hash = hash.sha256(buf)
        @verifyHash(_hash, public_key)
        
    verifyHash: (hash, public_key) ->
        assert.equal hash.length, 32, "A SHA 256 should be 32 bytes long, instead got #{hash.length}"
        ecdsa.verify curve, hash, {r:@r, s:@s}, public_key.Q

    ### <HEX> ###
    
    toByteBuffer: () ->
        b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
        @appendByteBuffer(b)
        b.copy 0, b.offset
    
    Signature.fromHex = (hex) ->
        Signature.fromBuffer new Buffer hex, "hex"

    toHex: () ->
        @toBuffer().toString "hex"
        
    Signature.signHex = (hex, private_key) ->
        buf = new Buffer hex, 'hex'
        @signBuffer buf, private_key

    verifyHex: (hex, public_key) ->
        buf = new Buffer hex, 'hex'
        @verifyBuffer buf, public_key

    ### </HEX> ###
        

module.exports = Signature
