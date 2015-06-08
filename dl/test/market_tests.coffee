secureRandom = require 'secure-random'

PrivateKey = require '../src/ecc/key_private'

ApiInstances = require('../src/rpc_api/ApiInstances')
MarketApi = require '../src/rpc_api/MarketApi'
market = new MarketApi()

th = require './test_helper'

describe "market_tests", ->

    api = null
    
    before (done)->
        api = ApiInstances.instance()
        api.init_promise.then ()->
            done()
        .catch th.log_error
    
    after ->
        api.close()
    
    it "market.sell_asset", (done)->
        NEW_ASSET = "A" + secureRandom.randomBuffer(2).toString('hex').toUpperCase()
        console.log '... new asset',NEW_ASSET
        tr = market.sell_asset(
            seller=11
            sell_amt = 1
            sell_symbol = "CORE"
            min_amt_receive = 1
            min_symbol_receive = "CORE" #NEW_ASSET
            timeout_sec = 10
            fill_kill = no
            transaction_expire_min = 10
            signer_private_key_id = 1
            signer_private_key = PrivateKey.fromSeed("nathan")
            broadcast = no
        )
        #console.log '... transaction_type.toObject(tr)', JSON.stringify transaction_type.toObject(tr),null,4
        tr.then (result)->
            th.print_result result
            #th.print_hex ""
            done()
        .catch th.log_error
        return

