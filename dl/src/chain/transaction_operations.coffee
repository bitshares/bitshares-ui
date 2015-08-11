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
Apis = require('rpc_api/ApiInstances')

module.exports = _my = {}

_my.signed_transaction = ->
    
    ref_block_num: 0
    ref_block_prefix: 0
    expiration: 0
    operations: []
    signatures: []
    
    add_operation: (operation) ->
        throw new Error "already finalized" if @tr_buffer
        v.required operation, "operation"
        v.required operation.get_operations, "operation.get_operations()"
        results = operation.get_operations()
        for result in results
            unless Array.isArray result
                throw new Error "Expecting array [operation_id, operation]"
            @operations.push result
        return
    
    add_type_operation: (name, operation) ->
        throw new Error "already finalized" if @tr_buffer
        v.required name, "name"
        v.required operation, "operation"
        _type = type[name]
        v.required _type, "Unknown operation #{name}"
        operation_id = chain_types.operations[_type.operation_name]
        if operation_id is undefined
            throw new Error "unknown operation: #{_type.operation_name}"
        unless operation.fee
            operation.fee = {amount: 0, asset_id: 0}
        operation_instance = _type.fromObject operation
        @operations.push [operation_id, operation_instance]
        return
    
    set_expire_minutes:(min)->
        throw new Error "already finalized" if @tr_buffer
        @expiration = Math.round(Date.now()/1000) + (min*60)
    
    set_required_fees:(asset_id)->
        throw new Error "already finalized" if @tr_buffer
        throw new Error "add operations first" unless @operations.length
        operations = for op in @operations
            type.operation.toObject op
        
        if not asset_id
            op1_fee = operations[0][1].fee
            if op1_fee and op1_fee.asset_id isnt null
                asset_id = op1_fee.asset_id
            else
                asset_id = "1.3.0"
        
        api.db_api().exec( "get_required_fees",
            [operations, asset_id]
        ).then (assets)=>
            #DEBUG console.log('... get_required_fees',assets)
            for i in [0...@operations.length] by 1
                @operations[i][1].fee = assets[i]
            return
    
    finalize:()->
        new Promise (resolve, reject)=>
            throw new Error "already finalized" if @tr_buffer
            if(@expiration == 0)
                @expiration = Math.round(Date.now()/1000) + (chain_config.expire_in_min * 60)
        
            resolve api.db_api().exec("get_objects", [["2.1.0"]]).then (r) =>
                @ref_block_num = r[0].head_block_number & 0xFFFF
                @ref_block_prefix =  new Buffer(r[0].head_block_id, 'hex').readUInt32LE(4)
                #DEBUG console.log("ref_block",@ref_block_num,@ref_block_prefix,r)
                lookup.resolve().then ()=>
                    for op in @operations
                        if op[1]["finalize"]
                            op[1].finalize()
                    @tr_buffer = type.transaction.toBuffer @
                    return
            return
    
    get_required_signatures:(available_keys)->
        return Promise.resolve([]) unless available_keys.length
        tr_object = type.signed_transaction.toObject @
        api.db_api().exec(
            "get_required_signatures",
            [tr_object, available_keys]
        ).then (required_public_keys)->
            #DEBUG console.log('... required_public_keys',required_public_keys)
            required_public_keys
    
    sign:(private_keys, chain_id = Apis.instance().chain_id)->
        throw new Error "not finalized" unless @tr_buffer
        private_keys = [ private_keys ] unless Array.isArray private_keys
        for i in [0...private_keys.length] by 1
            private_key = private_keys[i]
            sig = Signature.signBuffer(
                Buffer.concat([new Buffer(chain_id, 'hex'),@tr_buffer]), private_key
            )
            @signatures.push sig.toBuffer()
        return
    
    serialize:()->
        type.signed_transaction.toObject @
    
    id:()->
        throw new Error "not finalized" unless @tr_buffer
        hash.sha256(@tr_buffer).toString( 'hex' ).substring(0,40)

    toObject:()->
        type.signed_transaction.toObject @

    broadcast:()->
        new Promise (resolve, reject)=>
            throw new Error "not finalized" unless @tr_buffer
            throw new Error "not signed" unless @signatures.length
            throw new Error "no operations" unless @operations.length
            tr_object = type.signed_transaction.toObject @
            api.network_api().exec(
                "broadcast_transaction_with_callback",
                [()->
                    #DEBUG console.log('... broadcast_transaction_with_callback !!!')
                    resolve()
                ,tr_object]
            ).then ()->
                #DEBUG console.log('... broadcast success, waiting for callback')
                return
            .catch (error)=>
                #DEBUG console.log error # logged in GrapheneApi
                message = error.message
                message = "" unless message
                reject( new Error (
                    message + "\n" +
                    'graphene-ui ' +
                    ' digest ' + hash.sha256(@tr_buffer).toString('hex') +
                    ' transaction ' + @tr_buffer.toString('hex') +
                    ' ' + JSON.stringify(tr_object) )
                )
                return
            return

#class _my.transfer
#    _template = ->
#        fee : 
#            amount : 0
#            asset_id : 0 # 1.3.0
#        from: null       # 1.2.0
#        to: null         # 1.2.0
#        amount:
#            amount: "0"
#            asset_id: 0 # 1.3.0
#        memo:
#            from: null  # GPHXyz...public_key
#            to: null    # GPHXyz...public_key
#            nonce: "0" # "0"
#            message: null
#    
#    constructor:( @memo_from_privkey )->
#        for key in Object.keys _tmp = _template()
#            @[key] = _tmp[key]
#    
#    get_operations:->
#        @fee.asset_id = lookup.asset_id(@fee.asset_id)
#        @from = lookup.account_id(@from)
#        @to = lookup.account_id(@to)
#        @amount.asset_id = lookup.asset_id(@amount.asset_id)
#        if not @memo.message
#            @memo = undefined
#        else
#            to = @memo.to
#            @memo.from = lookup.memo_public_key(@memo.from)
#            @memo.to = lookup.memo_public_key(@memo.to)
#            if @memo_from_privkey
#                @memo.nonce = helper.unique_nonce_uint64()
#                @memo_to_public = lookup.memo_public_key(to)
#            else
#                empty_checksum = "\x00\x00\x00\x00"
#                # assert (new Buffer("\x00\x00\x00\x00")).toString() == "\x00\x00\x00\x00"
#                @memo.message = new Buffer(empty_checksum + @memo.message)
#            
#        [[ chain_types.operations.transfer, @]]
#
#    finalize:->
#        if @memo_from_privkey
#            ciphertext = Aes.encrypt_with_checksum(
#                @memo_from_privkey
#                @memo_to_public.resolve
#                @memo.nonce
#                @memo.message
#            )
#            @memo.message = new Buffer(ciphertext)
#        return

