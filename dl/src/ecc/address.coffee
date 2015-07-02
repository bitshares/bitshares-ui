assert = require 'assert'
ByteBuffer = require '../common/bytebuffer'
config = require '../chain/config'
hash = require '../common/hash'
base58 = require 'bs58'

class Address

    constructor: (@addy) ->
        
    Address.fromBuffer = (buffer) ->
        _hash = hash.sha512(buffer)
        addy = hash.ripemd160(_hash)
        new Address(addy)
    
    Address.fromString = (string) ->
        prefix = string.slice 0, config.address_prefix.length
        assert.equal config.address_prefix, prefix, "Expecting key to begin with #{config.address_prefix}, instead got #{prefix}"
        addy = string.slice config.address_prefix.length
        addy = new Buffer(base58.decode(addy), 'binary')
        checksum = addy.slice -4
        addy = addy.slice 0, -4
        new_checksum = hash.ripemd160 addy
        new_checksum = new_checksum.slice 0, 4
        assert.deepEqual checksum, new_checksum, 'Checksum did not match'
        new Address(addy)
    
    toBuffer: ->
        @addy
        
    toString: ->
        checksum = hash.ripemd160 @addy
        addy = Buffer.concat [@addy, checksum.slice 0, 4]
        config.address_prefix + base58.encode addy

module.exports = Address
