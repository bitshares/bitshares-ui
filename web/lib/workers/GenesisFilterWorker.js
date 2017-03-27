
var GenesisFilter = require( "chain/GenesisFilter" )

onmessage = function(event) { try {
    console.log("GenesisFilterWorker start");
    var { account_keys, bloom_filter } = event.data
    var genesis_filter = new GenesisFilter( bloom_filter )
    genesis_filter.filter( account_keys, status => {
        if( status.success ) {
            postMessage({ account_keys, status })
            console.log("GenesisFilterWorker done")
            return
        }
        postMessage({ status })
    })
} catch( e ) { console.error("GenesisFilterWorker", e) } }