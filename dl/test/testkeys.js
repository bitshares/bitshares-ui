var Aes = require ('ecc/aes')
import key from "common/key_utils"
import hash from "common/hash"
import PrivateKey from "ecc/key_private"

/** Usage: TESTWALLET=true npm test -- test/testwallet.js -g import_keys >t
*/
describe( "testkeys", ()=> {
    
    it( "import_keys", () => {
        if( ! process.env.TESTWALLET) return
        // some keys may overlaop with "initial_genesis_balances"
        var a=[], b=[]
        var aes = Aes.fromSeed("")
        for (var i = 0; i < 130 * 1000; i++) {
            var d = PrivateKey.fromBuffer(hash.sha256(""+i))
            a.push( aes.encryptHex(d.toBuffer().toString('hex')) )
            b.push( d.toPublicKey().toPublicKeyString() )
        }
        var o = {}
        o.encrypted_private_keys = a
        o.public_keys = b
        console.log(JSON.stringify(o,null,1))
    })
    
    it( "initial_genesis_balances", ()=> {
        if( ! process.env.TESTWALLET) return
        // some keys may overlaop with "import_keys"
        var initial_balances = []
        for (var i = 0; i < 1000; i++) {
            var d = PrivateKey.fromBuffer(hash.sha256(""+i))
            var owner = d.toPublicKey().toAddressString()
            initial_balances.push({
                owner,
                asset_symbol: "CORE",
                amount: "1"
            })
        }
        var balstr = JSON.stringify(initial_balances)
        console.log(balstr.split("},{").join("},\n{"))
    })
    
})