
PrivateKey = require '../ecc/key_private'
Aes = require '../ecc/aes'

hash = require './hash'
dictionary = require './dictionary_en'
secureRandom = require './secureRandom'

# hash for .25 second
HASH_POWER_MILLS = 250

module.exports = key =
    
    ###* Uses 1 second of hashing power to create a key/password checksum.  An
    implementation can re-call this method with the same password to re-match
    the strength of the CPU (either after moving from a desktop to a mobile,
    mobile to desktop, or N years from now when CPUs are presumably stronger).
    
    A salt is used for all the normal reasons...
    
    @return object {
        aes_private: Aes, 
        checksum: "{hash_iteration_count},{salt},{checksum}"
    }
    ###
    aes_checksum:(password)->
        throw new "password string required" unless typeof password is "string"
        salt = secureRandom.randomBuffer(4).toString('hex')
        iterations = 0
        secret = salt + password
        # hash for .1 second
        start_t = Date.now()
        while Date.now() - start_t < HASH_POWER_MILLS
            secret = hash.sha256 secret
            iterations += 1
        
        checksum = hash.sha256 secret
        checksum_string = [
            iterations
            salt.toString('hex')
            checksum.slice(0, 4).toString('hex')
        ].join ','
        
        aes_private: Aes.fromSeed(secret)
        checksum: checksum_string
    
    ###* Provide a matching password and key_checksum.  A "wrong password"
    error is thrown if the password does not match.  If this method takes
    much more or less than 1 second to return, one should consider updating
    all encyrpted fields using a new key.key_checksum.
    ###
    aes_private:(password, key_checksum)->
        [iterations, salt, checksum] = key_checksum.split ','
        secret = salt + password
        for i in [0...iterations] by 1
            secret = hash.sha256 secret
        new_checksum = hash.sha256 secret
        unless new_checksum.slice(0, 4).toString('hex') is checksum
            throw new Error "wrong password"
        Aes.fromSeed secret
    
    ###* @param1 string entropy of at least 32 bytes ###
    random32ByteBuffer:(entropy = @browserEntropy()) ->
        unless typeof entropy is 'string'
            throw new Error "string required for entropy"
        
        if entropy.length < 32
            throw new Error "expecting at least 32 bytes of entropy"
        
        iterations = 0
        start_t = Date.now()
        
        while Date.now() - start_t < HASH_POWER_MILLS
            entropy = hash.sha256 entropy
            iterations += 1
        
        hash_array = []
        
        # Take CPU speed into consideration (add iterations)
        hash_array.push new Buffer ""+iterations
        hash_array.push hash.sha256 entropy
        
        ### Secure Random ###
        # Note, this is after hashing for 1 second. Helps to ensure the computer
        # is not low on entropy.
        hash_array.push secureRandom.randomBuffer(32)
        hash.sha256 Buffer.concat(hash_array)
    
    ###* @param1 string entropy of at least 32 bytes ###
    suggest_brain_key:(entropy) ->
        randomBuffer = @random32ByteBuffer entropy
        
        word_count = 16
        dictionary_lines = dictionary.split ','
        
        unless dictionary_lines.length is 49744
            throw new Error "expecting #{49744} but got #{dictionary_lines.length} dictionary words"
        
        brainkey = for i in [0...(word_count * 2)] by 2
            # randomBuffer has 256 bits / 16 bits per word == 16 words
            num = (randomBuffer[i]<<8) + randomBuffer[i+1]
            # DEBUG console.log('... num',num.toString(16))
            
            # convert into a number between 0 and 1 (inclusive)
            rndMultiplier = num / Math.pow(2,16)
            wordIndex = Math.round dictionary_lines.length * rndMultiplier
            # DEBUG console.log '... i,num,rndMultiplier,wordIndex',i,num,rndMultiplier,wordIndex
            dictionary_lines[wordIndex]
        
        key.normalize_brain_key brainkey.join ' '
    
    get_random_key: (entropy) ->
        PrivateKey.fromBuffer @random32ByteBuffer entropy
    
    get_active_private: (owner_private, sequence = 0)->
        unless sequence >= 0
            throw new Error "invalid sequence"
        
        PrivateKey.fromBuffer(
            hash.sha256(hash.sha512(
                owner_private.toWif() + " " + sequence
            ))
        )
    
    normalize_brain_key: (brain_key)->
        unless typeof brain_key is 'string'
            throw new Error "string required for brain_key"
        
        brain_key = brain_key.trim()
        brain_key = brain_key.toUpperCase()
        brain_key.split(/[\t\n\v\f\r ]+/).join ' '
    
    browserEntropy: ->
        req = (variable, name)-> unless variable
            throw new Error "missing "+ name
        req window, "window"
        req navigator, "navigator"
        req window.screen, "window.screen"
        req window.location, "window.location"
        req window.history, "window.history"
        req navigator.language, "navigator.language"
        req navigator.mimeTypes, "navigator.mimeTypes"
        
        entropyStr = (new Date()).toString() + " " +
            + window.screen.height + " " + window.screen.width + " " 
            + window.screen.colorDepth + " " + " " + window.screen.availHeight 
            + " " + window.screen.availWidth + " " + window.screen.pixelDepth
            + navigator.language + " " +
            + window.location + " " +
            + window.history.length
        
        for mimeType in navigator.mimeTypes
            entropyStr += 
                mimeType.description + " " + 
                mimeType.type + " " + 
                mimeType.suffixes + " "
        
        b = new Buffer(entropyStr)
        entropyStr += b.toString('binary') + " " +
            (new Date()).toString()
        # DEBUG console.log('... entropyStr',entropyStr)
        entropyStr
    
    # https://github.com/cryptonomex/graphene-ui/issues/177
    # get_owner_private: (brain_key, sequence = 0)->
    #     unless sequence >= 0
    #         throw new Error "invalid sequence"
    #     
    #     brain_key = key.normalize_brain_key brain_key
    #     
    #     PrivateKey.fromBuffer(
    #         hash.sha256(hash.sha512(
    #             brain_key + " " + sequence
    #         ))
    #     )


