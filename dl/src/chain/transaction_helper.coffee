
module.exports = helper = {}

secureRandom = require 'secure-random'
hash = require '../common/hash'
type = require './serializer_operation_types'
key = require '../common/key_utils'
chain_types = require './chain_types'

Promise = require '../common/Promise'
ByteBuffer = require('../common/bytebuffer')
Long = ByteBuffer.Long
PrivateKey = require '../ecc/key_private'
Signature = require '../ecc/signature'
Aes = require '../ecc/aes'


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
    long.toString()

### Todo, set fees ###
helper.to_json=( tr, broadcast = false ) ->
    ((tr, broadcast)->
        tr_object = type.signed_transaction.toObject tr
        if broadcast
            net = require('../rpc_api/ApiInstances').instance().network_api()
            console.log '... tr_object', JSON.stringify tr_object
            net.exec "broadcast_transaction", [tr_object]
        else
            tr_object
    )(tr, broadcast)

helper.signed_tr_json=(tr, private_keys)->
    tr_buffer = type.transaction.toBuffer tr
    tr = type.transaction.toObject tr
    tr.signatures = for i in [0...private_keys.length] by 1
        private_key = private_keys[i]
        Signature.signBuffer( tr_buffer, private_key ).toHex() 
    tr

helper.expire_in_min=(min)->
    Math.round(Date.now() / 1000) + (min*60)

helper.seconds_from_now=(timeout_sec)->
    Math.round(Date.now() / 1000) + timeout_sec

###* 
    Print to the console a JSON representation of any object in 
    serializer_operation_types.coffee
###
helper.template=(serializer_operation_type_name, debug = {use_default: yes, annotate: yes})->
    so = type[serializer_operation_type_name]
    unless so
        throw new Error "unknown serializer_operation_type #{serializer_operation_type_name}"
    so.toObject undefined, debug

helper.new_operation=(serializer_operation_type_name)->
    so = type[serializer_operation_type_name]
    unless so
        throw new Error "unknown serializer_operation_type #{serializer_operation_type_name}"
    object = so.toObject undefined, {use_default: yes, annotate: yes}
    so.fromObject object

helper.instance=(object_id)->
    object_id.substring("0.0.".length)

