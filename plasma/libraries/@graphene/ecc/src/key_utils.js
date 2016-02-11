
var key;
var PrivateKey = require('./key_private');
var PublicKey = require('./key_public');
var Address = require('./address');
var Aes = require('./aes');

var hash = require('./hash');
// var dictionary = require('./dictionary_en');
var secureRandom = require('secure-random');
var config = require('../config');

// hash for .25 second
var HASH_POWER_MILLS = 250;

module.exports = key = {
    
    /** Uses 1 second of hashing power to create a key/password checksum.  An
    implementation can re-call this method with the same password to re-match
    the strength of the CPU (either after moving from a desktop to a mobile,
    mobile to desktop, or N years from now when CPUs are presumably stronger).
    
    A salt is used for all the normal reasons...
    
    @return object {
        aes_private: Aes, 
        checksum: "{hash_iteration_count},{salt},{checksum}"
    }
    */
    aes_checksum(password){
        if (!(typeof password === "string")) { throw new "password string required"(); }
        var salt = secureRandom.randomBuffer(4).toString('hex');
        var iterations = 0;
        var secret = salt + password;
        // hash for .1 second
        var start_t = Date.now();
        while (Date.now() - start_t < HASH_POWER_MILLS) {
            secret = hash.sha256(secret);
            iterations += 1;
        }
        
        var checksum = hash.sha256(secret);
        var checksum_string = [
            iterations,
            salt.toString('hex'),
            checksum.slice(0, 4).toString('hex')
        ].join( ',' );
        
        return {aes_private: Aes.fromSeed(secret),
        checksum: checksum_string
        };
    },
    
    /** Provide a matching password and key_checksum.  A "wrong password"
    error is thrown if the password does not match.  If this method takes
    much more or less than 1 second to return, one should consider updating
    all encyrpted fields using a new key.key_checksum.
    */
    aes_private(password, key_checksum){
        var [iterations, salt, checksum] = key_checksum.split(',');
        var secret = salt + password;
        for (var i = 0; 0 < iterations ? i < iterations : i > iterations; 0 < iterations ? i++ : i++) {
            secret = hash.sha256(secret);
        }
        var new_checksum = hash.sha256(secret);
        if (!(new_checksum.slice(0, 4).toString('hex') === checksum)) {
            throw new Error("wrong password");
        }
        return Aes.fromSeed(secret);
    },
    
    /**
        A week random number generator can run out of entropy.  This should ensure even the worst random number implementation will be reasonably safe.
        
        @param1 string entropy of at least 32 bytes
    */
    random32ByteBuffer(entropy = this.browserEntropy()) {
        
        if (!(typeof entropy === 'string')) {
            throw new Error("string required for entropy");
        }
        
        if (entropy.length < 32) {
            throw new Error("expecting at least 32 bytes of entropy");
        }
        
        var start_t = Date.now();
        
        while (Date.now() - start_t < HASH_POWER_MILLS)
            entropy = hash.sha256(entropy);
        
        var hash_array = [];
        hash_array.push(entropy);
        
        // Hashing for 1 second may helps the computer is not low on entropy (this method may be called back-to-back).
        hash_array.push(secureRandom.randomBuffer(32));
        
        return hash.sha256(Buffer.concat(hash_array));
    },
    
    get_random_key(entropy) {
        return PrivateKey.fromBuffer(this.random32ByteBuffer(entropy));
    },
    
    get_brainkey_private(brain_key, sequence = 0){
        if (sequence < 0) { throw new Error("invalid sequence"); }
        brain_key = key.normalize_brain_key(brain_key);
        return PrivateKey.fromBuffer( hash.sha256(hash.sha512(
            brain_key + " " + sequence
        )) );
    },

    // Turn invisible space like characters into a single space
    normalize_brain_key(brain_key){
        if (!(typeof brain_key === 'string')) {
            throw new Error("string required for brain_key");
        }
        
        brain_key = brain_key.trim();
        return brain_key.split(/[\t\n\v\f\r ]+/).join(' ');
    },
    
    browserEntropy() {

        var entropyStr = ""
        try {
            entropyStr = (new Date()).toString() + " "+ window.screen.height + " " + window.screen.width + " " + window.screen.colorDepth + " " + " " + window.screen.availHeight + " " + window.screen.availWidth + " " + window.screen.pixelDepth+ navigator.language + " " + window.location + " " + window.history.length;
        
            for (var i = 0, mimeType; i < navigator.mimeTypes.length; i++) {
                mimeType = navigator.mimeTypes[i];
                entropyStr += mimeType.description + " " + mimeType.type + " " + mimeType.suffixes + " ";
            }
            console.log("INFO\tbrowserEntropy gathered")
        } catch(error) {
            //nodejs:ReferenceError: window is not defined 
            entropyStr = hash.sha256((new Date()).toString())
        }
        
        var b = new Buffer(entropyStr);
        entropyStr += b.toString('binary') + " " + (new Date()).toString();
        return entropyStr;
    },

    // @return array of 5 legacy addresses for a pubkey string parameter.
    addresses(pubkey, address_prefix = config.address_prefix) {
        var public_key = PublicKey.fromPublicKeyString(pubkey, address_prefix);
        // S L O W
        var address_string = [
            Address.fromPublic(public_key, false, 0).toString(address_prefix), // btc_uncompressed
            Address.fromPublic(public_key, true, 0).toString(address_prefix),  // btc_compressed
            Address.fromPublic(public_key, false, 56).toString(address_prefix),// pts_uncompressed
            Address.fromPublic(public_key, true, 56).toString(address_prefix), // pts_compressed
            public_key.toAddressString(address_prefix) // bts_short, most recent format
        ];
        return address_string;
    }
};
