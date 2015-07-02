PrivateKey = require '../src/ecc/key_private'
PublicKey = require '../src/ecc/key_public'
Signature = require '../src/ecc/signature'
WebSocketRpc = require '../src/rpc_api/WebSocketRpc'
GrapheneApi = require '../src/rpc_api/GrapheneApi'

Promise = require '../src/common/Promise'
ByteBuffer = require '../src/common/bytebuffer'
secureRandom = require 'secure-random'

tr_helper = require '../src/chain/transaction_helper'
th = require './test_helper'

so_type = require '../src/chain/serializer_operation_types'
account_create_type = so_type.account_create
transaction_type = so_type.transaction
signed_transaction_type = so_type.signed_transaction

tr_op = require '../src/chain/transaction_operations'
signed_transaction = tr_op.signed_transaction
key_create =  tr_op.key_create
account_create = tr_op.account_create

ApiInstances = require('../src/rpc_api/ApiInstances')
WalletApi = require '../src/rpc_api/WalletApi'
ApplicationApi = require '../src/rpc_api/ApplicationApi'
wallet = new WalletApi()
app = new ApplicationApi()

###
import_key "1.2.15" "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
create_account_with_brain_key "brainkey" "newaccountname" "1.2.15" "1.2.0" 0 true
###
describe "tr_tests", ->

    broadcast = process.env.GPH_TEST_NO_BROADCAST is undefined
    genesis_private = PrivateKey.fromWif "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
    #genesis_active_1_3_0_public = PublicKey.fromBtsPublic "GPH6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV"
    api = null
    
    before (done)->
        api = ApiInstances.instance()
        api.init_promise.then ()->
            done()
        .catch th.log_error
    
    after ->
        api.close()
    
    it "wallet.account_create", (done)->
        suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        account_name = "account-z"+suffix
        console.log '... account_name',account_name
        tr = wallet.create_account_with_brain_key(
            "brainkey"
            account_name
            registrar = 15
            referrer = 0
            referrer_percent = 0
            broadcast
        ).trx_promise.then (result)->
            th.print_result result
            #th.print_hex ""
            done()
        .catch th.log_error
        return
    
    #it "update account transaction", ->
    it "wallet.transfer nomemo", (done)->
        wallet.transfer(
            "1.2.15", "1.2.0", 1, "1.3.0", memo = null
            broadcast
        ).then (result)->
            th.print_result result
            #th.print_hex ""
            done()
        .catch th.log_error
        return
    
    it "wallet.transfer encmemo", (done)->
        wallet.transfer(
            "1.2.15", "1.2.0", 1, "1.3.0", memo = "memo"
            broadcast
        ).then (result)->
            th.print_result result
            #th.print_hex ""
            done()
        .catch th.log_error
        return
    
    it "app.transfer_extended textmemo", (done)->
        tr = app.transfer_extended(
            "1.2.15", "1.2.0", 1, "1.3.0", "memo"
            "1.2.11", null #genesis_private
            "1.2.0"
            10, 11, PrivateKey.fromSeed("nathan")
            broadcast
        ).then (result)->
            th.print_result result
            #th.print_hex ""
            done()
        .catch th.log_error
        return
    
    it "app.transfer_extended encmemo", (done)->
        app.transfer_extended(
            from = "1.2.15"
            to = "1.2.0"
            amount = 1
            asset = "1.3.0"
            memo = "memo"
            memo_from = "1.2.11"
            memo_from_private = genesis_private
            memo_to = "1.2.0"
            expire = 10
            signer_private_id = 11
            signer_private_key = PrivateKey.fromSeed("nathan")
            broadcast
        ).then (result)->
            th.print_result result
            #th.print_hex ""
            done()
        , (e)-> th.log_error(e)
        return
    
    ###
    assertHexEqual=(x1, x2, msg)->
        return if x1 is x2
        console.log "ERROR: Unmatched binary\t", msg
        console.log "Original Transaction"
        ByteBuffer.fromHex(x1).printDebug()
        console.log "New Transaction"
        ByteBuffer.fromHex(x2).printDebug()
        throw new Error "Unmatched Transaction"
    
    check_trx=(description, trx)->
        # Match Transaction fromHex -> toHex 
        transaction = transaction_so.fromHex trx.hex
        #console.log JSON.stringify transaction_so.toObject(transaction),null,4
        
        assertHexEqual trx.hex,transaction_so.toHex(transaction),"initial construction\t" + description
        
        # Match Transaction toObject -> fromObject then match to the original hex
        trx_object = transaction_so.toObject transaction
        #console.log '... trx_object',JSON.stringify trx_object,null,2
        transaction2 = transaction_so.fromObject trx_object
        assertHexEqual trx.hex,transaction_so.toHex(transaction2),"re-construction\t" + description
        
        # readability only (technically redundant)
        if trx.json
            try
                transaction3 = transaction_so.fromObject trx.json
                assertHexEqual trx.hex,transaction_so.toHex(transaction3),"'json' object\t" + description
            catch error
                console.log 'WARNING',error,error.stack
        
        transaction
    
    check_object=(description, transaction_object)->
        transaction = transaction_so.fromObject transaction_object
        #console.log JSON.stringify transaction_so.toObject(transaction),null,4
        
        hex1 = transaction_so.toHex(transaction)
        #console.log '... transaction_hex', hex1
        
        transaction2 = transaction_so.fromHex(hex1)
        
        hex2 = transaction_so.toHex(transaction2)
        assertHexEqual hex1, hex2, "hex\t" + description
        
        serilized_object = transaction_so.toObject(transaction)
        #console.log '... transaction', JSON.stringify serilized_object,null,2
        
        transaction3 = transaction_so.fromObject serilized_object
        hex3 = transaction_so.toHex transaction3
        assertHexEqual hex1, hex3, "object\t" + description

    ###
    
