require("babel-polyfill");
import {Aes} from "bitsharesjs/es";

onmessage = function(event) { try {
    console.log("AesWorker start");
    let {private_plainhex_array, iv, key} = event.data;
    let aes = new Aes(iv, key);
    let private_cipherhex_array = [];
    for(let private_plainhex of private_plainhex_array) {
        let private_cipherhex = aes.encryptHex( private_plainhex );
        private_cipherhex_array.push( private_cipherhex );
    }
    postMessage( private_cipherhex_array );
    console.log("AesWorker done");
} catch( e ) { console.error("AesWorker", e); } };
