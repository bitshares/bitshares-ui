assert = require 'assert'
secureRandom = require 'secure-random'

WalletDb = require "stores/WalletDb"
AccountActions = require "actions/AccountActions"
PrivateKey = require "ecc/key_private"
PrivateKeyStore = require "stores/PrivateKeyStore"

# register listener
require "stores/WalletUnlockStore"

# Confirm only works when there is a UI
WalletDb.confirm_transactions = false

module.exports =

    print_result: (tr_object)->
        if tr_object
            console.log 'print_result', JSON.stringify tr_object
        try
            tr = signed_transaction_type.fromObject tr_object
            tr_hex = signed_transaction_type.toHex(tr)
            ByteBuffer.fromHex(tr_hex).printDebug()
        catch e
            if tr_object and tr_object["ref_block_num"]
                console.log "print_result: unparsed or non-transactoin object",e,e.stack
    
    print_hex: (hex)->
        console.log 'print_hex'
        ByteBuffer.fromHex(hex).printDebug()
        try
            tr = signed_transaction_type.fromHex hex
            tr_object = signed_transaction_type.toObject(tr)
            console.log JSON.stringify tr_object
        catch e
            console.log "print_hex: unparsed or non-transactoin object",e,e.stack
            
    log_error: (error)->
        if error.stack
            console.log 'ERROR',error.stack
        else
            console.log 'ERROR',error
    
    error: (message_substring, f)->
        fail = no
        try
            f()
            fail = yes
        catch e
            if e.toString().indexOf(message_substring) is -1
                throw new Error "expecting " + message_substring
        if fail
            throw new Error "expecting " + message_substring
    
    test_wallet: (
        suffix = secureRandom.randomBuffer(2).toString('hex').toLowerCase()
    ) =>
        #DEBUG console.log('... test_wallet')
        # Untested: Removed WalletDb.setCurrentWalletName
        WalletDb.onCreateWallet(
            "password",
            "brainkey" + suffix, 
            true, # unlock
            "default_" + suffix
        ).then(()=>
            #DEBUG console.log('... test_wallet onCreateWallet')
            WalletDb.importKeys([
                PrivateKey.fromSeed("nathan").toWif()
            ])#.then( (result)=> console.log('test_wallet importKeys success',result) )
        ).catch( (e)=>
            console.log('test_wallet',e)
        ).then => suffix
    
    test_account: ( suffix )=>
        AccountActions.createAccount(
            "account-"+ suffix
        )
