
var key = require('common/key_utils')

onmessage = function(event) { try {
    console.log("AddressIndexWorker start");
    var {pubkeys} = event.data
    var results = []
    for(let pubkey of pubkeys) results.push( key.addresses(pubkey) )
    postMessage( results )
    console.log("AddressIndexWorker done");
} catch( e ) { console.error("AddressIndexWorker", e) } }