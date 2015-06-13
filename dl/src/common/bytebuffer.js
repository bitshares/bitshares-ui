//From bytebuffer 3.5.4 index.js, removed used of __dirname.  Webpack's environment changes __dirname. 
/*var path = require("path"),
    ByteBufferNB = require( "../../node_modules/bytebuffer/dist/ByteBufferNB.js"),
    ByteBufferAB = require( "../../node_modules/bytebuffer/dist/ByteBufferAB.js");

module.exports = ByteBufferNB;
module.exports.ByteBufferNB = ByteBufferNB; // node Buffer backed
module.exports.ByteBufferAB = ByteBufferAB; // ArrayBuffer backed
*/
module.exports = require('../../lib/bytebuffer_3.5.4.js')
//module.exports = require('bytebuffer')
