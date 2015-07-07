
// npm install mocha-babel --save-dev
// ./node_modules/.bin/mocha --compilers js:mocha-babel,js:mocha-traceur,coffee:coffee-script --require coffee-script/register test/wallet_action_test.js --watch

try {
    //import WalletActions from "stores/WalletActions"
    //import WalletActions from "./src/stores/WalletActions"
    //import WalletActions from "../src/stores/WalletActions"
    //import WalletActions from "../src/stores/WalletActions.js"
    console.log('... WalletAction',WalletAction)
}catch(e) {
    console.log('...',e)
}
/**/

describe( "wallet_actions", ()=> {
    
    it( "wallet_create", ()=> {
    })
/*
    before( (done) => {
        api = ApiInstances.instance()
        api.init_promise.then ()->
            done()
        .catch th.log_error
    })
    after( ()=> {
        api.close()
    })
*/
})
