assert = require 'assert'
ByteBuffer = require '../src/common/bytebuffer'
ChainTypes = require '../src/chain/chain_types'
Serializer = require '../src/chain/serializer'
Convert = require '../src/chain/serializer_convert'
op_type = require '../src/chain/serializer_types'
#uint8 = op_type.uint8
#uint16 = op_type.uint16
#uint32 = op_type.uint32
#varint32 = op_type.varint32
#int64 = op_type.int64
#uint64 = op_type.uint64
#string = op_type.string
#bytes = op_type.bytes
bool = op_type.bool
#array = op_type.array
#fixed_array = op_type.fixed_array
#id_type = op_type.id_type
#protocol_id_type = op_type.protocol_id_type
#object_id_type = op_type.object_id_type
vote_id = op_type.vote_id
#optional = op_type.optional
static_variant = op_type.static_variant
#map = op_type.map
set = op_type.set

#so_type = require '../src/chain/serializer_operation_types'

describe "types", ->
    
    it "vote_id",->
        toHex=(id)->
            vote = vote_id.fromObject id
            Convert(vote_id).toHex vote
        assert.equal "ff000000", toHex "255:0"
        assert.equal "00ffffff", toHex "0:"+0xffffff
        out_of_range=(id)->
            try
                toHex id
                assert false, 'should have been out of range'
            catch e
                assert e.message.indexOf('out of range') isnt -1
        out_of_range "0:"+(0xffffff+1)
        out_of_range "256:0"
        
    it "set", ->
        bool_set = set bool
        assert.equal "03010001", Convert(bool_set).toHex [1,0,1]
