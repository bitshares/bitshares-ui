import {hash, key} from "graphenejs-lib";

var bts_genesiskeys_bloom_url = undefined
try {
    var url = require("file-loader?name=bts_genesiskeys_bloom_[sha1:hash:hex:7].dat!assets/bts_genesiskeys_bloom.dat")
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

    /** or call this.init */
    constructor(bloom_buffer) {
        if( ! bloom_buffer ) return
        this.bloom_buffer = bloom_buffer
        this.bits_in_filter = bloom_buffer.length * 8 // 8388608 (test data)
    }

    /** Was a bloom file deployed?  This does not try to load it from the server. */
    isAvailable() { return bts_genesiskeys_bloom_url !== undefined }

    init(done) {
        if( this.bloom_buffer ) { done(); return }
        if( ! this.isAvailable() )
            throw new Error("Genesis bloom file was not deployed")

        var xhr = new XMLHttpRequest
        // firefox 40 did not allow the blob url but ff 41.0.2 did
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
            var hex = hash.sha256( hashes + ':' + pubkey_or_address)
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

    filter( account_keys, status ) {
        if( ! this.isAvailable() ) {
            console.log("WARN: Missing bloom filter for BTS 0.9.x wallets")
            status({ error: "missing_bloom" })
            return
        }
        var initalizing = true
        status({ initalizing })
        this.init(()=> {
            try {
                initalizing = false
                status({ initalizing })
                var running_count_progress = 1
                for(var a = 0; a < account_keys.length; a++) {
                    var removed_count = 0, count = 0
                    var keys = account_keys[a]
                    var total = keys.encrypted_private_keys.length
                    status({ importing: true, account_name: keys.account_name, count, total })
                    for(var k = keys.encrypted_private_keys.length - 1; k >= 0; k--) {
                        count++
                        if( count % running_count_progress === 0 ) {
                            running_count_progress = 47
                            status({ importing: true, account_name: keys.account_name, count, total })
                        }
                        if( ! keys.public_keys) {
                            // un-released format, just for testing
                            status({ error: "missing_public_keys" })
                            return
                        }
                        var currentKey = keys.public_keys[k]
                        if( /^GPH/.test(currentKey) ) currentKey = "BTS" + currentKey.substring(3)
                        if(this.inGenesis( currentKey )) continue
                        var addresses = key.addresses(currentKey, 'BTS')
                        var addy_found = false
                        for(var i = 0; i < addresses.length; i++) {
                            if(this.inGenesis( addresses[i] )) {
                                addy_found = true
                                break
                            }
                        }
                        if( addy_found ) continue
                        delete keys.encrypted_private_keys[k]
                        delete keys.public_keys[k]
                        removed_count++
                    }
                    var encrypted_private_keys = [], public_keys = []
                    for(var k = keys.encrypted_private_keys.length - 1; k >= 0; k--) {
                        if( ! keys.encrypted_private_keys[k]) continue
                        encrypted_private_keys.push( keys.encrypted_private_keys[k] )
                        public_keys.push( keys.public_keys[k] )
                    }
                    keys.encrypted_private_keys = encrypted_private_keys
                    status({ importing: false, account_name: keys.account_name,
                        count: count - removed_count, total })
                    keys.public_keys = public_keys
                }
                status({ success: true,  })
            } finally {
                if( initalizing ) {
                    initalizing = false
                    status({ initalizing })
                }
            }
        })
    }

}
