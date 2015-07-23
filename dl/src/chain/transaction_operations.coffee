ObjectId = require './object_id'
Signature = require '../ecc/signature'
ByteBuffer = require('../common/bytebuffer')
Long = ByteBuffer.Long
Aes = require '../ecc/aes'

v = require './serializer_validation'
chain_types = require './chain_types'
chain_config = require './config'
hash = require('../common/hash')
type = require './serializer_operation_types'
validation = require('../common/validation')
lookup = require './lookup'
api = require('../rpc_api/ApiInstances').instance()
helper = require('../chain/transaction_helper')

fee = "2111100"

module.exports = _my = {}

_my.signed_transaction = ->
    
    ref_block_num: 0
    ref_block_prefix: 0
    expiration: 0
    operations: []
    signatures: []
    
    add_operation: (operation) ->
        v.required operation, "operation"
        v.required operation.get_operations, "operation.get_operations()"
        results = operation.get_operations()
        for result in results
            unless Array.isArray result
                throw new Error "Expecting array [operation_id, operation]"
            @operations.push result
        return
    
    add_type_operation: (name, operation) ->
        v.required name, "name"
        v.required operation, "operation"
        _type = type[name]
        v.required _type, "Unknown operation #{name}"
        operation_id = chain_types.operations[_type.operation_name]
        if operation_id is undefined
            throw new Error "unknown operation: #{_type.operation_name}"
        unless operation.fee
            operation.fee =
                amount: fee
                asset_id: "1.3.0"
        operation_instance = _type.fromObject operation
        @operations.push [operation_id, operation_instance]
        return
    
    set_expire_minutes:(min)->
        @expiration = Math.round(Date.now()/1000) + (min*60)
    
    finalize:(private_keys, broadcast = no)->
        if broadcast and not @operations.length
            return Promise.reject("no operations")
        
        ((tr, private_keys, broadcast)->
            if(tr.expiration == 0)
                tr.expiration = 
                    Math.round(Date.now()/1000) + (chain_config.expire_in_min * 60)
            
            new Promise (resolve, reject)->
                lookup.resolve().then ()->
                    for op in tr.operations
                        if op[1]["finalize"]
                            op[1].finalize()
                    
                    tr_buffer = type.transaction.toBuffer tr
                    # Debug
                    # ByteBuffer.fromBinary(tr_buffer.toString('binary')).printDebug()
                    private_keys = [ private_keys ] unless Array.isArray private_keys
                    for i in [0...private_keys.length] by 1
                        private_key = private_keys[i]
                        sig = Signature.signBuffer tr_buffer, private_key
                        tr.signatures.push sig.toBuffer()
                    
                    tr_object = type.signed_transaction.toObject(tr)
                    
                    unless broadcast
                        resolve tr_object
                        return
                    
                    ((private_key, tr_buffer, tr_object)->
                        api.network_api().exec("broadcast_transaction", [tr_object]).then ()->
                            resolve tr_object
                            return
                        .catch (error)->
                            signer_public = private_key.toPublicKey()
                            #console.log error # logged in GrapheneApi
                            message = error.message
                            message = "" unless message
                            reject (
                                message + "\n" +
                                'graphene-ui signer ' +
                                'address ' + signer_public.toBtsAddy() +
                                ' digest ' + hash.sha256(tr_buffer).toString('hex') +
                                ' public ' + signer_public.toBtsPublic() +
                                ' transaction ' + tr_buffer.toString('hex') +
                                ' ' + JSON.stringify(tr_object)
                            )
                            return
                        return
                    )(private_key, tr_buffer, tr_object)
                .catch (error)->
                    reject(error)
                    #console.error 'finalize error', error, error.stack
                    return
        )(@, private_keys, broadcast)


class _my.transfer
    _template = ->
        fee : 
            amount : fee
            asset_id : 0 # 1.3.0
        from: null       # 1.2.0
        to: null         # 1.2.0
        amount:
            amount: "0"
            asset_id: 0 # 1.3.0
        memo:
            from: null  # GPHXyz...public_key
            to: null    # GPHXyz...public_key
            nonce: "0" # "0"
            message: null
    
    constructor:( @memo_from_privkey )->
        for key in Object.keys _tmp = _template()
            @[key] = _tmp[key]
    
    get_operations:->
        @fee.asset_id = lookup.asset_id(@fee.asset_id)
        @from = lookup.account_id(@from)
        @to = lookup.account_id(@to)
        @amount.asset_id = lookup.asset_id(@amount.asset_id)
        if validation.is_empty_user_input @memo.message
            @memo = undefined
        else
            to = @memo.to
            @memo.from = lookup.memo_public_key(@memo.from)
            @memo.to = lookup.memo_public_key(@memo.to)
            if @memo_from_privkey
                @memo.nonce = helper.unique_nonce_uint64()
                @memo_to_public = lookup.memo_public_key(to)
            else
                empty_checksum = "\x00\x00\x00\x00"
                # assert (new Buffer("\x00\x00\x00\x00")).toString() == "\x00\x00\x00\x00"
                @memo.message = new Buffer(empty_checksum + @memo.message)
            
        [[ chain_types.operations.transfer, @]]

    finalize:->
        if @memo_from_privkey
            ciphertext = Aes.encrypt_with_checksum(
                @memo_from_privkey
                @memo_to_public.resolve
                @memo.nonce
                @memo.message
            )
            @memo.message = new Buffer(ciphertext)
        return

