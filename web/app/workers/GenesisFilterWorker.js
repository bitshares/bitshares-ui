
var config = require( "chain/config" )
var key_utils = require( "common/key_utils" )
var GenesisFilter = require( "chain/GenesisFilter" )
var genesis_filter = new GenesisFilter

onmessage = function(event) { try {
    console.log("GenesisFilterWorker start");
    var { account_keys } = event.data
    filter( account_keys, status => {
        if( status.success ) {
            postMessage({ account_keys, status })
            console.log("GenesisFilterWorker done")
            return
        }
        postMessage({ status })
    })
} catch( e ) { console.error("GenesisFilterWorker", e) } }

var filter = function( account_keys, status ) {
    if( ! genesis_filter.isAvailable() ) {
        console.log("WARN: Missing bloom filter for BTS 0.9.x wallets")
        status({ error: "missing_bloom" })
        return
    }
    var initalizing = true
    status({ initalizing })
    var previous_address_prefix = config.address_prefix
    try {
        config.address_prefix = "BTS"
        genesis_filter.init(()=> {
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
                        var key = keys.public_keys[k]
                        if( /^GPH/.test(key) ) key = "BTS" + key.substring(3)
                        if(genesis_filter.inGenesis( key )) continue
                        var addresses = key_utils.addresses(key)
                        var addy_found = false
                        for(var i = 0; i < addresses.length; i++) {
                            if(genesis_filter.inGenesis( addresses[i] )) {
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
                status({ success: true })
            } finally { config.address_prefix = previous_address_prefix }
        })
    } finally { 
        if( initalizing ) {
            initalizing = false
            status({ initalizing })
        }
    }
}