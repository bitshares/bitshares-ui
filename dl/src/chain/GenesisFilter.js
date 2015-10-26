import h from "common/hash"

var bts_genesiskeys_bloom_url = undefined
try {
    var url = require("file?name=bts_genesiskeys_bloom_[sha1:hash:hex:7].dat!assets/bts_genesiskeys_bloom.dat")
    if(url.indexOf("3cee441") === -1)
        throw new Error("Incorrect hash: bts_genesiskeys_bloom.dat")
    bts_genesiskeys_bloom_url = url
} catch(e) {
    // webpack deployment exception (not run time)
    console.log("WARN: Will be unable to filter BTS 1.0 wallet imports, did not find assets/bts_genesiskeys_bloom.dat", e)
}

/**
    This should only be applied to a BTS 1.0 export file taken on the 
    discontinued chain. Any public key string or address (all 5 formats) carried
    over to the BTS 2.0 genesis block will be in this filter.

    Their may be some false positives but no false negatives.
*/
export default class GenesisFilter {
    
    /** Was a bloom file deployed?  This does not try to load it from the server. */
    isAvailable() { return bts_genesiskeys_bloom_url !== undefined }
    
    init(done) {
        if( this.bloom_buffer ) { done(); return }
        if( ! this.isAvailable() )
            throw new Error("Genesis bloom file was not deployed")
        
        var xhr = new XMLHttpRequest
        xhr.responseType = "blob"
        xhr.onload = ()=> {
            if (xhr.status === 404) return
            var reader = new FileReader
            reader.onload = evt => {
                var contents = new Buffer(evt.target.result, 'binary')
                if( contents.length !== 1048576) throw new Error("Wrong length")
                this.bits_in_filter = contents.length * 8 // 8388608 (test data)
                this.bloom_buffer = contents
                done()
            }
            reader.readAsBinaryString(xhr.response)
        }
        xhr.onerror = () => { console.error('xhr.onerror',e) }
        xhr.open("GET", bts_genesiskeys_bloom_url)
        xhr.send()
    }
    
    inGenesis(pubkey_or_address) {
        if( ! this.bloom_buffer ) throw new Error("Call init() first")
        for(var hashes = 0; hashes < 3; hashes++) {
            var hex = h.sha256( hashes + ':' + pubkey_or_address)
            var bit_address = parseInt(hex.slice(-3).toString('hex'), 16) % this.bits_in_filter // 3090564
            // console.error("bit_address", bit_address.toString(16))
            var byte_address = bit_address >> 3 // 386320
            // console.error("byte_address", byte_address.toString(16))
            var mask = 1 << (bit_address & 7) // 16
            // console.error("mask", mask.toString(16))
            var byte = this.bloom_buffer[byte_address]
            // console.error("byte", byte.toString(16))
            // console.error("byte & mask", byte & mask, (byte & mask) === 0, '\n')
            if( (byte & mask) === 0 ) return false
        }
        return true
    }
    
}