ByteBuffer = require '../common/bytebuffer'
Long = ByteBuffer.Long

vt = require './serializer_validation'
ObjectId = require './object_id'
Serializer = require './serializer'
ChainTypes = require './chain_types'

fp = require '../common/fast_parser'
Address = require '../ecc/address'
PublicKey = require '../ecc/key_public'

module.exports = Types = {}

Types.uint8 =
    fromByteBuffer:(b)-> b.readUint8()
    appendByteBuffer:(b, object)->
        b.writeUint8 object; return
    fromObject:(object)-> object
    toObject:(object, use_default = no)->
        return 0 if use_default and object is undefined
        int = parseInt object
        vt.require_range 0,0xFF,int, "uint8 #{object}"
        int
Types.uint16 =
    fromByteBuffer:(b)-> b.readUint16()
    appendByteBuffer:(b, object)->
        b.writeUint16 object
        return
    fromObject:(object)-> object
    toObject:(object, use_default = no)->
        return 0 if use_default and object is undefined
        int = parseInt object
        vt.require_range 0,0xFFFF,int, "uint16 #{object}"
        int
Types.uint32 =
    fromByteBuffer:(b)-> b.readUint32()
    appendByteBuffer:(b, object)->
        b.writeUint32 object
        return
    fromObject:(object)-> object
    toObject:(object, use_default = no)->
        return 0 if use_default and object is undefined
        int = parseInt object
        vt.require_range 0,0xFFFFFFFF,int, "uint32 #{object}"
        int
Types.varint32 =
    fromByteBuffer:(b)-> b.readVarint32()
    appendByteBuffer:(b, object)->
        b.writeVarint32 object; return
    fromObject:(object)-> object
    toObject:(object, use_default = no)->
        return 0 if use_default and object is undefined
        int = parseInt object
        vt.require_range 0,0xFFFFFFFF,int, "uint32 #{object}"
        int
Types.int64 =
    fromByteBuffer:(b)->
        b.readInt64()
    appendByteBuffer:(b, object)->
        b.writeInt64 vt.to_long object
        return
    fromObject:(object)->
        Long.fromString "" + vt.require_digits object
    toObject:(object, use_default = no)->
        return "0" if use_default and object is undefined
        object.toString()
Types.uint64 =
    fromByteBuffer:(b)->
        b.readUint64()
    appendByteBuffer:(b, object)->
        b.writeUint64 vt.to_long object
        return
    fromObject:(object)->
        Long.fromString "" + vt.require_digits object
    toObject:(object, use_default = no)->
        return "0" if use_default and object is undefined
        object.toString()

Types.string =
    fromByteBuffer:(b)->
        len = b.readVarint32()
        b_copy = b.copy(b.offset, b.offset + len); b.skip len
        new Buffer(b_copy.toBinary(), 'binary')
    appendByteBuffer:(b, object)->
        b.writeVarint32(object.length)
        b.append(object.toString('binary'), 'binary')
        return
    fromObject:(object)->
        new Buffer object
    toObject:(object, use_default = no)->
        return "" if use_default and object is undefined
        object.toString()

Types.bytes = (size)->
    fromByteBuffer:(b)->
        if size is undefined
            len = b.readVarint32()
            b_copy = b.copy(b.offset, b.offset + len); b.skip len
            new Buffer(b_copy.toBinary(), 'binary')
        else
            b_copy = b.copy(b.offset, b.offset + size); b.skip size
            new Buffer(b_copy.toBinary(), 'binary')
    appendByteBuffer:(b, object)->
        if size is undefined
            b.writeVarint32(object.length)
            b.append(object.toString('binary'), 'binary')
        else
            b.append(object.toString('binary'), 'binary')
        return
    fromObject:(object)->
        new Buffer object, 'hex'
    toObject:(object, use_default = no)->
        if use_default and object is undefined
            zeros=(num)-> new Array( num ).join( "00" )
            return zeros size
        object.toString 'hex'

Types.bool =
    fromByteBuffer:(b)->
        b.readUint8()
    appendByteBuffer:(b, object)->
        # supports boolean or integer
        b.writeUint8 if object then 1 else 0
        #b.writeUint8 object
        return
    fromObject:(object)->
        if object then 1 else 0
    toObject:(object, use_default = no)->
        return no if use_default and object is undefined
        if object then yes else no

Types.array = (st_operation)->
    fromByteBuffer:(b)->
        for i in [0...b.readVarint32()] by 1
            st_operation.fromByteBuffer b
    appendByteBuffer:(b, object)->
        b.writeVarint32 object.length
        for o in object
            st_operation.appendByteBuffer b, o
        return
    fromObject:(object)->
        for o in object
            st_operation.fromObject o
    toObject:(object, use_default = no)->
        if use_default and object is undefined
            return [ st_operation.toObject(undefined, yes) ]
        for o in object
            st_operation.toObject o

Types.time_point_sec =
    fromByteBuffer:(b)-> b.readUint32()
    appendByteBuffer:(b, object)->
        b.writeUint32 object
        return
    fromObject:(object)->
        Math.round( (new Date(object)).getTime() / 1000 )
    toObject:(object, use_default = no)->
        if use_default and object is undefined
            return (new Date(0)).toISOString().split('.')[0]
        int = parseInt object
        vt.require_range 0,0xFFFFFFFF,int, "uint32 #{object}"
        (new Date(int*1000)).toISOString().split('.')[0]

# todo, set is sorted and unique
Types.set = Types.array

# global_parameters_update_operation current_fees
Types.fixed_array = (count, st_operation)->
    fromByteBuffer:(b)->
        for i in [0...count] by 1
            st_operation.fromByteBuffer b
    appendByteBuffer:(b, object)->
        for i in [0...count] by 1
            st_operation.appendByteBuffer b, object[i]
        return
    fromObject:(object)->
        for i in [0...count] by 1
            st_operation.fromObject object[i]
    toObject:(object, use_default = no)->
        return if use_default and object is undefined
            for i in [0...count] by 1
                st_operation.toObject undefined, yes
        for i in [0...count] by 1
            st_operation.toObject object[i]

### Supports instance numbers (11) or object types (1.3.11).  Object type
validation is enforced when an object type is used. ###
id_type = (reserved_spaces, object_type)->
    vt.required reserved_spaces, "reserved_spaces"
    vt.required object_type, "object_type"
    fromByteBuffer:(b)->
        b.readVarint32()
    appendByteBuffer:(b, object)->
        object = object.resolve if object.resolve isnt undefined
        # convert 1.3.n into just n
        if /^[0-9]+\.[0-9]+\.[0-9]+$/.test object
            object = vt.get_instance reserved_spaces, object_type, object
        b.writeVarint32 object
        return
    fromObject:(object)->
        object = object.resolve if object.resolve isnt undefined
        if vt.is_digits object
            return vt.to_number object
        vt.get_instance reserved_spaces, object_type, object
    toObject:(object, use_default = no)->
        object_type_id = ChainTypes.object_type[object_type]
        if use_default and object is undefined
            return "#{reserved_spaces}.#{object_type_id}.0"
        object = object.resolve if object.resolve isnt undefined
        if /^[0-9]+\.[0-9]+\.[0-9]+$/.test object
            object = vt.get_instance reserved_spaces, object_type, object
        
        "#{reserved_spaces}.#{object_type_id}."+object

Types.protocol_id_type = (name)->
    id_type ChainTypes.reserved_spaces.protocol_ids, name

Types.object_id_type = 
    fromByteBuffer:(b)->
        ObjectId.fromByteBuffer b
    appendByteBuffer:(b, object)->
        object = object.resolve if object.resolve isnt undefined
        object = ObjectId.fromString object
        object.appendByteBuffer b
        return
    fromObject:(object)->
        object = object.resolve if object.resolve isnt undefined
        ObjectId.fromString object
    toObject:(object, use_default = no)->
        if use_default and object is undefined
            return "0.0.0"
        if object.resolve isnt undefined
            object = object.resolve
        object = ObjectId.fromString object
        object.toString()

Types.vote_id =
    TYPE: 0x000000FF
    ID:   0xFFFFFF00
    fromByteBuffer:(b)->
        value = b.readUint32()
        type: value & @TYPE
        id: value & @ID
    appendByteBuffer:(b, object)->
        value = object.id << 8 | object.type
        b.writeUint32 value
        return
    fromObject:(object)->
        vt.required object, "vote_id"
        vt.require_test /^[0-9]+:[0-9]+$/, object, "vote_id format #{object}" 
        [type, id] = object.split ':'
        vt.require_range 0,0xff,type,"vote type #{object}"
        vt.require_range 0,0xffffff,id,"vote id #{object}"
        type:type
        id:id
    toObject:(object, use_default = no)->
        if use_default and object is undefined
            return "0:0"
        object.id + ":" + object.type

Types.optional = (st_operation)->
    vt.required st_operation, "st_operation"
    fromByteBuffer:(b)->
        unless b.readUint8() is 1
            return undefined
        st_operation.fromByteBuffer b
    appendByteBuffer:(b, object)->
        if object
            b.writeUint8 1
            st_operation.appendByteBuffer b, object
        else
            b.writeUint8 0
        return
    fromObject:(object)->
        return undefined if object is undefined
        st_operation.fromObject object
    toObject:(object, use_default = no)->
        if use_default and object is undefined
            object = st_operation.toObject undefined, yes
            if typeof object is "object"
                object.__optional = "parent is optional"
            else
                object = __optional: object
            return object
        return undefined if object is undefined
        st_operation.toObject object

Types.static_variant = (_st_operations)->
    st_operations: _st_operations
    fromByteBuffer:(b)->
        type_id = b.readVarint32()
        st_operation = @st_operations[type_id]
        vt.required st_operation, "operation #{type_id}"
        [
            type_id
            st_operation.fromByteBuffer b
        ]
    appendByteBuffer:(b, object)->
        type_id = object[0]
        st_operation = @st_operations[type_id]
        vt.required st_operation, "operation #{type_id}"
        b.writeVarint32 type_id
        st_operation.appendByteBuffer b, object[1]
        return
    fromObject:(object)->
        type_id = object[0]
        st_operation = @st_operations[type_id]
        vt.required st_operation, "operation #{type_id}"
        [
            type_id
            st_operation.fromObject object[1]
        ]
    toObject:(object, use_default = no)->
        if use_default and object is undefined
            return [0, @st_operations[0].toObject(undefined, yes)]
        type_id = object[0]
        st_operation = @st_operations[type_id]
        vt.required st_operation, "operation #{type_id}"
        [
            type_id
            st_operation.toObject object[1]
        ]

# todo, map has unique keys
Types.map = (key_st_operation, value_st_operation)->
    fromByteBuffer:(b)->
        for i in [0...b.readVarint32()] by 1
            [
                key_st_operation.fromByteBuffer b
                value_st_operation.fromByteBuffer b
            ]
    appendByteBuffer:(b, object)->
        b.writeVarint32 object.length
        for o in object
            key_st_operation.appendByteBuffer b, o[0]
            value_st_operation.appendByteBuffer b, o[1]
        return
    fromObject:(object)->
        for o in object
            [
                key_st_operation.fromObject o[0]
                value_st_operation.fromObject o[1]
            ]
    toObject:(object, use_default = no)->
        if use_default and object is undefined
            return [
                [
                    key_st_operation.toObject(undefined, yes)
                    value_st_operation.toObject(undefined, yes)
                ]
            ]
        for o in object
            [
                key_st_operation.toObject o[0]
                value_st_operation.toObject o[1]
            ]

Types.public_key =
    fromByteBuffer:(b)->
        fp.public_key b
    appendByteBuffer:(b, object)->
        fp.public_key b, object
    fromObject:(object)->
        PublicKey.fromBtsPublic object
    toObject:(object, use_default = no)->
        if use_default and object is undefined
            return "GPHXyz...public_key"
        object.toBtsPublic()

Types.address =
    fromByteBuffer:(b)->
        fp.ripemd160 b
    appendByteBuffer:(b, object)->
        fp.ripemd160 b, object
    fromObject:(object)->
         Address.fromString object
    toObject:(object, use_default = no)->
        if use_default and object is undefined
            return "GPHXyz...address"
        new Address(object.public_key).toString()

