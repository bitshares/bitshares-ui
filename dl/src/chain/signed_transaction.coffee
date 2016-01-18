ObjectId = require './object_id'
Signature = require '../ecc/signature'
PublicKey = require '../ecc/key_public'
ByteBuffer = require('bytebuffer')
Long = ByteBuffer.Long
Aes = require '../ecc/aes'

v = require './serializer_validation'
chain_types = require './chain_types'
chain_config = require './config'
hash = require('../common/hash')
type = require './serializer_operation_types'
validation = require('../common/validation')
lookup = require './lookup'
helper = require('../chain/transaction_helper')
Apis = require('rpc_api/ApiInstances')
ChainStore = (require 'api/ChainStore').default

module.exports = _my = {}

_my.signed_transaction = ->

    ref_block_num: 0
    ref_block_prefix: 0
    expiration: 0
    operations: []
    signatures: []
    signer_private_keys: []

    add_type_operation: (name, operation) ->
        @add_operation @get_type_operation name, operation
        return

    add_operation: (operation) ->
        throw new Error "already finalized" if @tr_buffer
        v.required operation, "operation"
        unless Array.isArray operation
            throw new Error "Expecting array [operation_id, operation]"
        @operations.push operation
        return

    get_type_operation: (name, operation) ->
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
        if name is 'proposal_create'
            operation.expiration_time ||= (base_expiration_sec() + chain_config.expire_in_secs_proposal) * 1000
        operation_instance = _type.fromObject operation
        [operation_id, operation_instance]

    set_expire_seconds:(sec)->
        throw new Error "already finalized" if @tr_buffer
        @expiration = base_expiration_sec() + sec
    
    # Wraps this transaction in a proposal_create transaction
    propose:(proposal_create_options)->
        throw new Error "already finalized" if @tr_buffer
        throw new Error "add operation first" if not @operations.length
        v.required proposal_create_options, "proposal_create_options"
        v.required proposal_create_options.fee_paying_account, "proposal_create_options.fee_paying_account"
        proposed_ops = for op in @operations
            op: op # op_wrapper
        @operations = []
        @signatures = []
        @signer_private_keys = []
        proposal_create_options.proposed_ops = proposed_ops
        @add_type_operation "proposal_create", proposal_create_options
        @
    
    has_proposed_operation:->
        for op in @operations
            if op[1].proposed_ops
                return yes
        return no
    
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

        promises = [
            Apis.instance().db_api().exec( "get_required_fees",
                [operations, asset_id]
            )
        ]

        if asset_id isnt "1.3.0"
            asset = ChainStore.getAsset(asset_id)
            fee_pool = asset.getIn ["dynamic", "fee_pool"]
            promises.push Apis.instance().db_api().exec( "get_required_fees",
                [operations, "1.3.0"]
            )

        Promise.all(promises)
        .then (results)=>
            fees = results[0]

            if asset_id isnt "1.3.0"
                coreFees = results[1]
                totalFees = 0
                for fee in coreFees
                    totalFees += fee.amount

                if totalFees > parseInt fee_pool, 10
                    fees = coreFees
                    asset_id = "1.3.0"

            flat_assets = []
            flatten = (obj) ->
                if Array.isArray obj
                    for item in obj
                        flatten item
                else
                    flat_assets.push obj
                return
            flatten fees
            asset_index = 0
            for i in [0...@operations.length] by 1
                set_fee = (operation) ->
                    operation.fee =  flat_assets[ asset_index++ ]
                    if operation.proposed_ops
                        for y in [0...operation.proposed_ops.length] by 1
                            set_fee operation.proposed_ops[y].op[1]
                set_fee @operations[i][1]
            #DEBUG console.log('... get_required_fees',operations,asset_id,flat_assets)
            return

    finalize:()->
        new Promise (resolve, reject)=>
            throw new Error "already finalized" if @tr_buffer
            @expiration ||= base_expiration_sec() + chain_config.expire_in_secs
            resolve Apis.instance().db_api().exec("get_objects", [["2.1.0"]]).then (r) =>
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

    get_potential_signatures:()->
        tr_object = type.signed_transaction.toObject @
        Promise.all([
            Apis.instance().db_api().exec( "get_potential_signatures", [tr_object] )
            Apis.instance().db_api().exec( "get_potential_address_signatures", [tr_object] )
        ]).then (results)->
            {pubkeys: results[0], addys: results[1]}

    get_required_signatures:(available_keys)->
        return Promise.resolve([]) unless available_keys.length
        tr_object = type.signed_transaction.toObject @
        #DEBUG console.log('... tr_object',tr_object)
        Apis.instance().db_api().exec(
            "get_required_signatures",
            [tr_object, available_keys]
        ).then (required_public_keys)->
            #DEBUG console.log('... get_required_signatures',required_public_keys)
            required_public_keys

    add_signer:(private_key, public_key)->
        throw new Error "already signed" if @signed
        unless public_key.Q
            public_key = PublicKey.fromPublicKeyString public_key
        @signer_private_keys.push [private_key, public_key]

    sign:(chain_id = Apis.instance().chain_id)->
        throw new Error "not finalized" unless @tr_buffer
        throw new Error "already signed" if @signed
        unless @signer_private_keys.length
            throw new Error "Transaction was not signed. Do you have a private key? [no_signers]"
        for i in [0...@signer_private_keys.length] by 1
            [private_key, public_key] = @signer_private_keys[i]
            sig = Signature.signBuffer(
                Buffer.concat([new Buffer(chain_id, 'hex'), @tr_buffer])
                private_key
                public_key
            )
            @signatures.push sig.toBuffer()
        @signer_private_keys = []
        @signed = true
        return

    serialize:()->
        type.signed_transaction.toObject @

    id:()->
        throw new Error "not finalized" unless @tr_buffer
        hash.sha256(@tr_buffer).toString( 'hex' ).substring(0,40)

    toObject:()->
        type.signed_transaction.toObject @

    _broadcast:(was_broadcast_callback)->
        new Promise (resolve, reject)=>
            @sign() if not @signed
            throw new Error "not finalized" unless @tr_buffer
            throw new Error "not signed" unless @signatures.length
            throw new Error "no operations" unless @operations.length
            tr_object = type.signed_transaction.toObject @
            Apis.instance().network_api().exec(
                "broadcast_transaction_with_callback",
                [ (res) ->
                    #console.log('... broadcast_transaction_with_callback !!!')
                    resolve(res)
                ,tr_object]
            ).then ()->
                #console.log('... broadcast success, waiting for callback')
                was_broadcast_callback()
                return
            .catch (error)=>
                # console.log may be redundant for network errors, other errors could occur
                console.log error
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

    broadcast:(was_broadcast_callback)->
        if (@tr_buffer)
            return @_broadcast(was_broadcast_callback)
        else
            @finalize().then =>
                @_broadcast(was_broadcast_callback)

base_expiration_sec = ()=>
    head_block_sec = Math.ceil(ChainStore.getHeadBlockDate().getTime() / 1000)
    now_sec = Math.ceil(Date.now() / 1000)
    # The head block time should be updated every 3 seconds.  If it isn't
    # then help the transaction to expire (use head_block_sec)
    return head_block_sec if now_sec - head_block_sec > 30
    # If the user's clock is very far behind, use the head block time.
    Math.max now_sec, head_block_sec
