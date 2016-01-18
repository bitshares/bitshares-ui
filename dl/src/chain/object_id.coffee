Long = (require 'bytebuffer').Long

chain_types = require './chain_types'
v = require './serializer_validation'

class ObjectId

    DB_MAX_INSTANCE_ID = Long.fromNumber ((Math.pow 2,48)-1)
    
    constructor:(@space,@type,@instance)->
        instance_string = @instance.toString()
        object_id = "#{@space}.#{@type}.#{instance_string}"
        unless v.is_digits instance_string
            throw new "Invalid object id #{object_id}"
    
    ObjectId.fromString=(value)->
        if (
            value.space isnt undefined and 
            value.type isnt undefined and
            value.instance isnt undefined
        )
            return value
        params = v.require_match(
            /^([0-9]+)\.([0-9]+)\.([0-9]+)$/
            v.required value, "object_id"
            "object_id"
        )
        new ObjectId(
            parseInt params[1]
            parseInt params[2]
            Long.fromString params[3]
        )
    
    ObjectId.fromLong=(long)->
        space = long.shiftRight(56).toInt()
        type = long.shiftRight(48).toInt() & 0x00ff
        instance = long.and DB_MAX_INSTANCE_ID
        new ObjectId space, type, instance
    
    ObjectId.fromByteBuffer=(b)->
        ObjectId.fromLong b.readUint64()
        
    toLong:->
        Long.fromNumber(@space).shiftLeft(56).or(
            Long.fromNumber(@type).shiftLeft(48).or @instance
        )
    
    appendByteBuffer:(b)->
        b.writeUint64 @toLong()
    
    toString:->
        "#{@space}.#{@type}.#{@instance.toString()}"

module.exports = ObjectId
