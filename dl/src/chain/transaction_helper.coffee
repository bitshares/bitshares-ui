
module.exports = helper = {}

api = require('../rpc_api/ApiInstances').instance()

secureRandom = require 'secure-random'

hash = require '../common/hash'
Promise = require '../common/Promise'
ByteBuffer = require('../common/bytebuffer')
Long = ByteBuffer.Long

PrivateKey = require '../ecc/key_private'
Signature = require '../ecc/signature'
Aes = require '../ecc/aes'

ChainTypes = require './chain_types'
so_type = require './serializer_operation_types'

helper.get_owner_private=get_owner_private=(brain_key)->
    normalize_brain_key=(brain_key)->
        brain_key = brain_key.trim()
        brain_key = brain_key.toUpperCase()
        brain_key.split(/[\t\n\v\f\r ]+/).join ' '
    
    brain_key = normalize_brain_key brain_key
    PrivateKey.fromBuffer(
        hash.sha256 hash.sha512 brain_key + " 0"
    )

helper.get_active_private=get_active_private=(owner_private)->
    PrivateKey.fromBuffer(
        hash.sha256 hash.sha512 owner_private.toWif() + " 0"
    )

helper.unique_nonce_entropy = null
helper.unique_nonce_uint64=->
    entropy = helper.unique_nonce_entropy = (
        if helper.unique_nonce_entropy is null
            #console.log('... secureRandom.randomUint8Array(1)[0]',secureRandom.randomUint8Array(1)[0])
            parseInt secureRandom.randomUint8Array(1)[0]
        else
            ++helper.unique_nonce_entropy % 256
    )
    long = Long.fromNumber Date.now()
    #console.log('unique_nonce_uint64 date\t',ByteBuffer.allocate(8).writeUint64(long).toHex(0))
    #console.log('unique_nonce_uint64 entropy\t',ByteBuffer.allocate(8).writeUint64(Long.fromNumber(entropy)).toHex(0))
    long = long.shiftLeft(8).or(Long.fromNumber(entropy))
    #console.log('unique_nonce_uint64 shift8\t',ByteBuffer.allocate(8).writeUint64(long).toHex(0))
    long

### Todo, set fees ###
helper.to_json=( tr, broadcast = false ) ->
    ((tr, broadcast)->
        tr_object = so_type.signed_transaction.toObject tr
        if broadcast
            net = api.network_api()
            console.log '... tr_object', JSON.stringify tr_object
            net.exec "broadcast_transaction", [tr_object]
        else
            tr_object
    )(tr, broadcast)

helper.signed_tr_json=(tr, key_ids, private_keys)->
    tr_buffer = so_type.transaction.toBuffer tr
    tr = so_type.transaction.toObject tr
    tr.signatures = for i in [0...private_keys.length] by 1
        key_id = key_ids[i]
        private_key = private_keys[i]
        [ 
            key_id
            Signature.signBuffer( tr_buffer, private_key ).toHex() 
        ]
    tr

helper.expire_in_min=(min)->
    Math.round(Date.now() / 1000) + (min*60)

helper.seconds_from_now=(timeout_sec)->
    Math.round(Date.now() / 1000) + timeout_sec

###* 
    Print to the console a JSON representation of any object in 
    serializer_operation_types.coffee
###
helper.template=(serializer_operation_type_name, indent = 0)->
    so = so_type[serializer_operation_type_name]
    unless so
        throw new Error "unknown serializer_operation_type #{serializer_operation_type_name}"
    object = so.toObject undefined, {use_default: yes, annotate: yes}
    console.log JSON.stringify object,null,indent
    return

helper.new_operation=(serializer_operation_type_name)->
    so = so_type[serializer_operation_type_name]
    unless so
        throw new Error "unknown serializer_operation_type #{serializer_operation_type_name}"
    object = so.toObject undefined, {use_default: yes, annotate: yes}
    so.fromObject object

helper.instance=(object_id)->
    object_id.substring("0.0.".length)

