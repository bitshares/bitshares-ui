var BigInteger = require('bigi');
var ecurve = require('ecurve');
var secp256k1 = ecurve.getCurveByName('secp256k1');
BigInteger = require('bigi');
var base58 = require('bs58');
var hash = require('./hash');
var config = require('../config');
var assert = require('assert');

class PublicKey {

    /** @param {ecurve.Point} public key */
    constructor(Q) { this.Q = Q; }
    
    static fromBinary(bin) {
        return PublicKey.fromBuffer(new Buffer(bin, 'binary'));
    }

    static fromBuffer(buffer) {
        return new PublicKey(ecurve.Point.decodeFrom(secp256k1, buffer));
    }

    toBuffer(compressed = this.Q.compressed) {
        return this.Q.getEncoded(compressed);
    }
        
    static fromPoint(point) {
        return new PublicKey(point);
    }

    toUncompressed() {
        var buf = this.Q.getEncoded(false);
        var point = ecurve.Point.decodeFrom(secp256k1, buf);
        return PublicKey.fromPoint(point);
    }
    
    /** bts::blockchain::address (unique but not a full public key) */
    toBlockchainAddress() {
        var pub_buf = this.toBuffer();
        var pub_sha = hash.sha512(pub_buf);
        return hash.ripemd160(pub_sha);
    }
    
    /** Alias for {@link toPublicKeyString} */
    toString(address_prefix = config.address_prefix) {
        return this.toPublicKeyString(address_prefix)
    }
    
    /**
        Full public key 
        {return} string
    */
    toPublicKeyString(address_prefix = config.address_prefix) {
        var pub_buf = this.toBuffer();
        var checksum = hash.ripemd160(pub_buf);
        var addy = Buffer.concat([pub_buf, checksum.slice(0, 4)]);
        return address_prefix + base58.encode(addy);
    }
    
    /**
        @arg {string} public_key - like GPHXyz...
        @arg {string} address_prefix - like GPH
        @return PublicKey or `null` (if the public_key string is invalid)
    */
    static fromPublicKeyString(public_key, address_prefix = config.address_prefix) {
        try {
            return PublicKey.fromStringOrThrow(public_key, address_prefix)
        } catch (e) {
            console.error("ERROR\tPublicKey\tfromString", e, "stack", e.stack);
            return null;
        }
    }
    
    /**
        @arg {string} public_key - like GPHXyz...
        @arg {string} address_prefix - like GPH
        @throws {Error} if public key is invalid
        @return PublicKey
    */
    static fromStringOrThrow(public_key, address_prefix = config.address_prefix) {
        var prefix = public_key.slice(0, address_prefix.length);
        assert.equal(
            address_prefix, prefix,
            `Expecting key to begin with ${address_prefix}, instead got ${prefix}`);
            public_key = public_key.slice(address_prefix.length);

        public_key = new Buffer(base58.decode(public_key), 'binary');
        var checksum = public_key.slice(-4);
        public_key = public_key.slice(0, -4);
        var new_checksum = hash.ripemd160(public_key);
        new_checksum = new_checksum.slice(0, 4);
        assert.deepEqual(checksum, new_checksum, 'Checksum did not match');
        return PublicKey.fromBuffer(public_key);
    }
    
    toAddressString(address_prefix = config.address_prefix) {
        var pub_buf = this.toBuffer();
        var pub_sha = hash.sha512(pub_buf);
        var addy = hash.ripemd160(pub_sha);
        var checksum = hash.ripemd160(addy);
        addy = Buffer.concat([addy, checksum.slice(0, 4)]);
        return address_prefix + base58.encode(addy);
    }
        
    toPtsAddy() {
        var pub_buf = this.toBuffer();
        var pub_sha = hash.sha256(pub_buf);
        var addy = hash.ripemd160(pub_sha);
        addy = Buffer.concat([new Buffer([0x38]), addy]); //version 56(decimal)
        
        var checksum = hash.sha256(addy);
        checksum = hash.sha256(checksum);
        
        addy = Buffer.concat([addy, checksum.slice(0, 4)]);
        return base58.encode(addy);
    }
    
    child( offset ) {
        
        assert(Buffer.isBuffer(offset), "Buffer required: offset")
        assert.equal(offset.length, 32, "offset length")
        
        offset = Buffer.concat([ this.toBuffer(), offset ])
        offset = hash.sha256( offset )
        
        let c = BigInteger.fromBuffer( offset )
        let cG = secp256k1.G.multiply(c)
        let Qprime = this.Q.add(cG)
        return PublicKey.fromPoint(Qprime)
    }

    /* <HEX> */
    
    toByteBuffer() {
        var b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
        this.appendByteBuffer(b);
        return b.copy(0, b.offset);
    }
    
    static fromHex(hex) {
        return PublicKey.fromBuffer(new Buffer(hex, 'hex'));
    }

    toHex() {
        return this.toBuffer().toString('hex');
    }
        
    static fromPublicKeyStringHex(hex) {
        return PublicKey.fromPublicKeyString(new Buffer(hex, 'hex'));
    }
        
    /* </HEX> */
}


module.exports = PublicKey;
