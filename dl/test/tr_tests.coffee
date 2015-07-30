PrivateKey = require '../src/ecc/key_private'
PublicKey = require '../src/ecc/key_public'
Signature = require '../src/ecc/signature'
Aes = require 'ecc/aes'
WebSocketRpc = require '../src/rpc_api/WebSocketRpc'
GrapheneApi = require '../src/rpc_api/GrapheneApi'

Promise = require '../src/common/Promise'
ByteBuffer = require '../src/common/bytebuffer'
secureRandom = require 'secure-random'
assert = require 'assert'

tr_helper = require '../src/chain/transaction_helper'
th = require './test_helper'

hash = require 'common/hash'
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
WalletDb = require 'stores/WalletDb'
PrivateKeyStore = require "stores/PrivateKeyStore"
ApplicationApi = require '../src/rpc_api/ApplicationApi'
wallet = new WalletApi()
app = new ApplicationApi()

helper = require "./test_helper"
iDB = require "../src/idb-instance"
fakeIndexedDB = require "fake-indexeddb"

###
import_key "1.2.15" "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
create_account_with_brain_key "brainkey" "newaccountname" "1.2.15" "1.2.14" 0 true
###
describe "tr_tests", ->

    broadcast = process.env.GPH_TEST_NO_BROADCAST is undefined
    genesis_private = PrivateKey.fromWif "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
    api = null
    
    before (done)->
        iDB.init_instance(fakeIndexedDB).init_promise.then () ->
            #PrivateKeyStore.loadDbData().then ()->
            api = ApiInstances.instance()
            api.init_promise.then ()->
                done()
            .catch th.log_error
    
    after (done)->
        iDB.instance().db().close()
        fakeIndexedDB.deleteDatabase("graphene_db")
        api.close()
        done()
    
    it "wallet.account_create", (done)->
        suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
        account_name = "account-z"+suffix
        # DEBUG console.log '... account_name',account_name
        tr = wallet.create_account_with_brain_key(
            "brainkey"
            account_name
            registrar = 15
            referrer = 0
            referrer_percent = 0
            broadcast
        ).then (result)->
            #th.print_result result
            #th.print_hex ""
            done()
        .catch th.log_error
        return
    
    #it "update account transaction", ->
    it "wallet.transfer nomemo", (done)->
        helper.test_wallet().then (suffix)=>
            wallet.transfer(
                "1.2.15", "1.2.14", 1, "1.3.0", memo = null
                broadcast, encrypt_memo = no
            ).then (result)->
                #th.print_result result
                #th.print_hex ""
                done()
            .catch th.log_error
        return
    
    it "wallet.transfer encmemo", (done)->
        helper.test_wallet().then (suffix)=>
            wallet.transfer(
                "1.2.15", "1.2.14", 1, "1.3.0", memo = "memo"
                broadcast
            ).then (result)->
                #th.print_result result
                #th.print_hex ""
                done()
            .catch th.log_error
        return
    
    # Aes.encrypt data is not matching c++
    it "wallet encmemo_format", ()->
        sender = PrivateKey.fromSeed("1")
        receiver = PrivateKey.fromSeed("2")
        enc_hex = Aes.encrypt_with_checksum(
            sender
            receiver.toPublicKey()
            nonce = 12345
            "Hello, world!"
        )
        #console.log('... enc_hex',enc_hex.toString('hex'))
        memo={
            from: sender.toPublicKey()
            to: receiver.toPublicKey()
            nonce: 12345
            message: new Buffer(enc_hex, 'hex')
        }
        enc_buffer = hash.sha256 so_type.memo_data.toBuffer memo
        assert.equal(
            enc_buffer.toString('hex')
            "8de72a07d093a589f574460deb19023b4aff354b561eb34590d9f4629f51dbf3"
        )
        assert.equal(
            Aes.decrypt_with_checksum(
                receiver
                sender.toPublicKey()
                nonce = 12345
                enc_hex
            )
            "Hello, world!"
        )
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
    
