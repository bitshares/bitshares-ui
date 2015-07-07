
// ./node_modules/.bin/mocha --compilers js:mocha-babel,js:mocha-traceur,coffee:coffee-script --require coffee-script/register test/wallet_action_test.js -g wallet_action_test --watch
try {
    import WalletActions from "stores/WalletActions"
    console.log('... WalletAction',WalletAction)
}catch(e) {
    console.log('...',e)
}

/*
describe( "wallet_action_tests", ()=> {

    var broadcast = process.env.GPH_TEST_NO_BROADCAST is undefined
    //var genesis_private = PrivateKey.fromWif("5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3")
    var api = null
    
    before( (done) => {
        api = ApiInstances.instance()
        api.init_promise.then ()->
            done()
        .catch th.log_error
    })
    after( ()=> {
        api.close()
    })
})*/
