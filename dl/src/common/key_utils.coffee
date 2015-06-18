
PrivateKey = require '../ecc/key_private'

hash = require './hash'
dictionary = require './dictionary_en'
secureRandom = require './secureRandom'
v = require '../common/validation'

module.exports = key =
    
    ###* @param1 string entropy of at least 32 bytes ###
    suggest_brain_key:(entropy) ->
        unless typeof brain_key is 'string'
            throw new Error "string required for entropy"
        
        if entropy.length < 32
            throw new Error "expecting at least 32 bytes of entropy"
        
        hash_array = []
        
        ###  Secure Random ###
        hash_array.push secureRandom.randomBuffer(32)
        hash_array.push hash.sha256 entropy
        
        # randomBuffer will be 32 bytes
        randomBuffer = hash.sha256 Buffer.concat(hash_array)
        # DEBUG console.log '... randomBuffer',randomBuffer.toString 'hex'
        
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
        
        brainkey.join ' '
    
    normalize_brain_key: (brain_key)->
        unless typeof brain_key is 'string'
            throw new Error "string required for brain_key"
        
        brain_key = brain_key.trim()
        brain_key = brain_key.toUpperCase()
        brain_key.split(/[\t\n\v\f\r ]+/).join ' '
    
    get_owner_private: (brain_key)->
        brain_key = key.normalize_brain_key brain_key
        PrivateKey.fromBuffer(
            hash.sha256 hash.sha512 brain_key + " 0"
        )
    
    get_active_private: (owner_private)->
        PrivateKey.fromBuffer(
            hash.sha256 hash.sha512 owner_private.toWif() + " 0"
        )

