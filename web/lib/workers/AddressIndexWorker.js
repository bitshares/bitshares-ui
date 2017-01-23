import {key} from "bitsharesjs/es";

onmessage = function(event) {
    try {
        console.log("AddressIndexWorker start");
        let {pubkeys, address_prefix} = event.data;
        let results = [];
        for (let pubkey of pubkeys) {
            results.push( key.addresses(pubkey, address_prefix) );
        }
        postMessage( results );
        console.log("AddressIndexWorker done");
    } catch( e ) {
        console.error("AddressIndexWorker", e);
    }
};
