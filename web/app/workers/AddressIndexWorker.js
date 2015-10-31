
var key = require('common/key_utils')
var chain_config = require('chain/config')

onmessage = function(event) { try {
    console.log("AddressIndexWorker start");
    var {pubkeys, address_prefix} = event.data
    chain_config.address_prefix = address_prefix
    var results = []
    for(let pubkey of pubkeys) results.push( key.addresses(pubkey) )
    postMessage( results )
    console.log("AddressIndexWorker done");
} catch( e ) { console.error("AddressIndexWorker", e) } }