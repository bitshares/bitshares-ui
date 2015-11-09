require("babel/polyfill");
var key = require('common/key_utils')
var Aes = require('ecc/aes')

onmessage = function(event) { try {
    console.log("AesWorker start");
    var {private_plainhex_array, iv, key} = event.data
    var aes = new Aes(iv, key)
    var private_cipherhex_array = []
    for(let private_plainhex of private_plainhex_array) {
        var private_cipherhex = aes.encryptHex( private_plainhex )
        private_cipherhex_array.push( private_cipherhex )
    }
    postMessage( private_cipherhex_array )
    console.log("AesWorker done");
} catch( e ) { console.error("AesWorker", e) } }
