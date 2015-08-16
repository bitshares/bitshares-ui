ecurve = require 'ecurve'
Point = ecurve.Point
secp256k1 = ecurve.getCurveByName 'secp256k1'
BigInteger = require 'bigi'
base58 = require 'bs58'
assert = require 'assert'
hash = require '../common/hash'

PublicKey = require './key_public'
Aes = require './aes'

class PrivateKey

    ###*
    @param {BigInteger}
    ###
    constructor: (@d) ->

    PrivateKey.fromBuffer = (buf) ->
        if 32 isnt buf.length
            console.log("WARN: Expecting 32 bytes, instead got #{buf.length}")
        new PrivateKey BigInteger.fromBuffer(buf)
    
    PrivateKey.fromSeed = (seed) -> # generate_private_key
        unless typeof seed is 'string'
            throw new Error 'seed must be of type string'
        PrivateKey.fromBuffer hash.sha256 seed
    
    PrivateKey.fromWif = (_private_wif) ->
        private_wif = new Buffer base58.decode _private_wif
        version = private_wif.readUInt8(0)
        assert.equal 0x80, version, "Expected version #{0x80}, instead got #{version}"
        # checksum includes the version
        private_key = private_wif.slice 0, -4
        checksum = private_wif.slice -4
        new_checksum = hash.sha256 private_key
        new_checksum = hash.sha256 new_checksum
        new_checksum = new_checksum.slice 0, 4
        assert.deepEqual checksum, new_checksum #, 'Invalid checksum'
        private_key = private_key.slice 1
        PrivateKey.fromBuffer private_key
        
    toWif: ->
        private_key = @toBuffer()
        # checksum includes the version
        private_key = Buffer.concat [new Buffer([0x80]), private_key]
        checksum = hash.sha256 private_key
        checksum = hash.sha256 checksum
        checksum = checksum.slice 0, 4
        private_wif = Buffer.concat [private_key, checksum]
        base58.encode private_wif

    ###*
    @return {Point}
    ###
    toPublicKeyPoint: ->
        Q = secp256k1.G.multiply(@d)

    toPublicKey: ->
        PublicKey.fromPoint @toPublicKeyPoint()
    
    toBuffer: ->
        buf = @d.toBuffer()
        if buf.length isnt 32
            len = buf.length
            pad = 32 - len
            #DEBUG console.log('... zeros',pad)
            zeros = ""
            zeros += "0" for i in [0...pad] by 1
            buf = Buffer.concat [new Buffer(zeros), buf]
            #DEBUG console.log "BigInteger toBuffer was #{len} bytes and was padded to #{buf.length} bytes"
        buf
    
    ###* ECIES ###
    get_shared_secret:(public_key)->
        KB = public_key.toUncompressed().toBuffer()
        KBP = Point.fromAffine(
            secp256k1
            x = BigInteger.fromBuffer KB.slice 1,33
            y = BigInteger.fromBuffer KB.slice 33,65
        )
        r = @toBuffer()
        P = KBP.multiply BigInteger.fromBuffer r
        S = P.affineX.toBuffer {size: 32}
        # SHA512 used in ECIES
        hash.sha512 S
    
    ### <helper_functions> ###
    
    toByteBuffer: () ->
        b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
        @appendByteBuffer(b)
        b.copy 0, b.offset
    
    PrivateKey.fromHex = (hex) ->
        PrivateKey.fromBuffer new Buffer hex, 'hex'

    toHex: ->
        @toBuffer().toString 'hex'
        
    ### </helper_functions> ###

module.exports = PrivateKey
