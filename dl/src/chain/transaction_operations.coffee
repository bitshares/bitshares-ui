ChainTypes = require './chain_types'
ObjectId = require './object_id'
Signature = require '../ecc/signature'
ByteBuffer = require('../common/bytebuffer')
Long = ByteBuffer.Long
Aes = require '../ecc/aes'

so_type = require './serializer_operation_types'
is_empty_user_input = require('../common/validation').is_empty_user_input
vt = require './serializer_validation'
required = vt.required
lookup = new (require './lookup')()
api = require('../rpc_api/ApiInstances').instance()
helper = require('../chain/transaction_helper')

module.exports = _my = {}

_my.signed_transaction = ->
    
    ref_block_num: 0
    ref_block_prefix: 0
    relative_expiration: 0
    operations: []
    signatures: []
    
    add_operation: (operation) ->
        required operation, "operation"
        results = operation.get_operations()
        for result in results
            unless Array.isArray result
                throw new Error "Expecting array [operation_id, operation]"
            @operations.push result
        return
    
    add_operation_type: (operation, type) ->
        required operation, "operation"
        required type, "type"
        required type.operation_name, "operation_name"
        operation_id = ChainTypes.operations[type.operation_name]
        if operation_id is undefined
            throw new Error "unknown operation: #{type.operation_name}"
        @operations.push [operation_id, operation]
        return
    
    set_expire_minutes:(min)->
        @ref_block_prefix = Math.round(Date.now()/1000) + (min*60)
    
    finalize:(key_ids, private_keys, broadcast = no)->
        ((tr, key_ids, private_keys, broadcast)->
            lookup.resolve().then ()->
                for op in tr.operations
                    if op[1]["finalize"]
                        op[1].finalize()
                
                tr_buffer = so_type.transaction.toBuffer tr
                # Debug
                # ByteBuffer.fromBinary(tr_buffer.toString('binary')).printDebug()
                key_ids = [ key_ids ] unless Array.isArray key_ids
                private_keys = [ private_keys ] unless Array.isArray private_keys
                for i in [0...private_keys.length] by 1
                    key_id = key_ids[i]
                    private_key = private_keys[i]
                    sig = Signature.signBuffer tr_buffer, private_key
                    tr.signatures.push [ key_id, sig.toBuffer() ]
                tr_object = so_type.signed_transaction.toObject(tr)
                return tr_object unless broadcast
                api.network_api().exec("broadcast_transaction", [tr_object])
            , (error)->
                console.error 'finalize error', error, error.stack
        )(@, key_ids, private_keys, broadcast)
    
_my.key_create = ->
    fee:
        amount: Long.ZERO
        asset_id: 0
    fee_paying_account: null
    key_data: [ 1, "GPHXyx...public_key" ]

_my.key_create.fromPublicKey = (public_key)->
    required public_key.Q, "PublicKey"
    kc = _my.key_create()
    kc.key_data[0] = 1
    kc.key_data[1] = public_key
    kc

_my.key_create.fromAddress = (address)->
    required address.addy, "Address"
    kc = _my.key_create()
    kc.key_data[0] = 0
    kc.key_data[1] = address
    kc

    
class _my.account_create
    _template = ->
        fee:
            amount: Long.ZERO
            asset_id: 0
        registrar: 0
        referrer: 0
        referrer_percent: 100
        name: ""
        owner:
            weight_threshold: 1
            auths: [ [ ObjectId.fromString("0.2.0"),  1 ] ]
        active:
            weight_threshold: 1
            auths: [ [  ObjectId.fromString("0.2.1"),  1 ] ]
        voting_account: 0 # 1.3.0
        memo_key: ObjectId.fromString("0.2.1")
        num_witness: 0
        num_committee: 0
        vote: [  ] # 0:0

    constructor:(@owner_key_create, @active_key_create)->
        for key in Object.keys _tmp = _template()
            @[key] = _tmp[key]
        required @owner_key_create
        unless @active_key_create
            @active_key_create = @owner_key_create
    
    get_operations:->
        @fee.asset_id = lookup.asset_id(@fee.asset_id)
        @registrar = lookup.account_id(@registrar)
        @referrer = lookup.account_id(@referrer)
        @voting_account = lookup.account_id(@voting_account)
        if @owner_key_create.fee_paying_account is null
            @owner_key_create.fee_paying_account = @registrar
        if @active_key_create.fee_paying_account is null
            @active_key_create.fee_paying_account = @registrar
        [
            [ ChainTypes.operations.key_create, @owner_key_create ]
            [ ChainTypes.operations.key_create, @active_key_create ]
            [ ChainTypes.operations.account_create, @ ]
        ]

class _my.transfer
    _template = ->
        fee : 
            amount : "0"
            asset_id : 0# 1.4.0
        from: null      # 1.3.0
        to: null        # 1.3.0
        amount:
            amount: "0"
            asset_id: 0 # 1.4.0
        memo:
            from: null  # 1.2.0
            to: null    # 1.2.0
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
        if is_empty_user_input @memo.message
            @memo = undefined
        else
            to = @memo.to
            @memo.from = lookup.memo_key_id(@memo.from)
            @memo.to = lookup.memo_key_id(@memo.to)
            if @memo_from_privkey
                @memo.nonce = helper.unique_nonce_uint64()
                @memo_to_public = lookup.memo_public_key(to)
            else
                empty_checksum = "\x00\x00\x00\x00"
                @memo.message = new Buffer(empty_checksum + @memo.message)
            
        [[ ChainTypes.operations.transfer, @]]

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

