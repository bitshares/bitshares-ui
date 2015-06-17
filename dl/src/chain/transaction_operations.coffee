ObjectId = require './object_id'
Signature = require '../ecc/signature'
ByteBuffer = require('../common/bytebuffer')
Long = ByteBuffer.Long
Aes = require '../ecc/aes'

v = require './serializer_validation'
chain_types = require './chain_types'
hash = require('../common/hash')
type = require './serializer_operation_types'
validation = require('../common/validation')
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
    extra_signatures: []
    
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
                amount: "0"
                asset_id: "1.4.0"
        operation_instance = _type.fromObject operation
        @operations.push [operation_id, operation_instance]
        return
    
    set_expire_minutes:(min)->
        @ref_block_prefix = Math.round(Date.now()/1000) + (min*60)
    
    ###* Always returns a promise.  If broadcast is true it returns the result
    from the server, if not it returns the json transaction object.  ###
    finalize:(key_ids, private_keys, broadcast = no)->
        ((tr, key_ids, private_keys, broadcast)->
            new Promise (resolve, reject)->
                lookup.resolve().then ()->
                    for op in tr.operations
                        if op[1]["finalize"]
                            op[1].finalize()
                    
                    tr_buffer = type.transaction.toBuffer tr
                    # Debug
                    # ByteBuffer.fromBinary(tr_buffer.toString('binary')).printDebug()
                    key_ids = [ key_ids ] unless Array.isArray key_ids
                    private_keys = [ private_keys ] unless Array.isArray private_keys
                    for i in [0...private_keys.length] by 1
                        key_id = key_ids[i]
                        private_key = private_keys[i]
                        sig = Signature.signBuffer tr_buffer, private_key
                        tr.signatures.push [ key_id, sig.toBuffer() ]
                    
                    tr_object = type.signed_transaction.toObject(tr)
                    
                    unless broadcast
                        resolve tr_object
                        return
                    
                    ((private_key, tr_buffer, tr_object)->
                        api.network_api().exec("broadcast_transaction", [tr_object]).then (result)->
                            resolve result
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
        )(@, key_ids, private_keys, broadcast)
    
_my.key_create = ->
    fee:
        amount: Long.ZERO
        asset_id: 0
    fee_paying_account: null
    key_data: [ 1, "GPHXyx...public_key" ]

_my.key_create.fromPublicKey = (public_key)->
    v.required public_key.Q, "PublicKey"
    kc = _my.key_create()
    kc.key_data[0] = 1
    kc.key_data[1] = public_key
    kc

_my.key_create.fromAddress = (address)->
    v.required address.addy, "Address"
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
        v.required @owner_key_create
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
            [ chain_types.operations.key_create, @owner_key_create ]
            [ chain_types.operations.key_create, @active_key_create ]
            [ chain_types.operations.account_create, @ ]
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
        if validation.is_empty_user_input @memo.message
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

