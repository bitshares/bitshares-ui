
import { key } from "@graphene/ecc"

/** This file imports a large dictionary.  Don't include anything other than dictionary related code here. */
var dictionary = require('./dictionary_en')


/** @param1 string entropy of at least 32 bytes */
export function suggest_brain_key(entropy = key.browserEntropy()) {
    
    var randomBuffer = key.random32ByteBuffer(entropy);

    var word_count = 16;
    var dictionary_lines = dictionary.split(',');

    if (!(dictionary_lines.length === 49744)) {
        throw new Error(`expecting ${49744} but got ${dictionary_lines.length} dictionary words`);
    }

    var brainkey = []
    var end = word_count * 2
    
    for(let i = 0; i < end; i += 2) {
        
        // randomBuffer has 256 bits / 16 bits per word == 16 words
        var num = (randomBuffer[i]<<8) + randomBuffer[i+1];
        // DEBUG console.log('... num',num.toString(16))

        // convert into a number between 0 and 1 (inclusive)
        var rndMultiplier = num / Math.pow(2,16);
        var wordIndex = Math.round(dictionary_lines.length * rndMultiplier);
        // DEBUG console.log('... i,num,rndMultiplier,wordIndex',i,num,rndMultiplier,wordIndex,dictionary_lines[wordIndex])
        
        brainkey.push(dictionary_lines[wordIndex]);
    }
    // DEBUG console.log("key.normalize_brain_key(brainkey.join(' '))", key.normalize_brain_key(brainkey.join(' ')))
    return key.normalize_brain_key(brainkey.join(' '));
}

// convert to mnemonic encoding (perhaps put this as a separate library)
// graphene-ui has a full dictionary
// it("suggest_brain_key", function() {
//     this.timeout(1500);
//     var entropy = secureRandom.randomBuffer(32);
//     var brainkey = min_time_elapsed(function(){
//         return suggest_brain_key(entropy.toString('binary'));
//     });
//     assert.equal(16, brainkey.split(' ').length);
// });