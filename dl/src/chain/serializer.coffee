ByteBuffer = require 'bytebuffer'
EC = require '../common/error_with_cause'
config = require './serializer_config'

class Serializer
    
    constructor: (@operation_name, @types) ->
        
    fromByteBuffer: (b) ->
        object = {}
        field = null
        try
            for field in Object.keys @types
                type = @types[field]
                try
                    if config.hex_dump
                        if type.operation_name
                            console.error type.operation_name
                        else
                            o1 = b.offset
                            type.fromByteBuffer b
                            o2 = b.offset
                            b.offset = o1
                            #b.reset()
                            _b = b.copy o1, o2
                            console.error(
                                "#{@operation_name}.#{field}\t" 
                                _b.toHex()
                            )
                    object[field] = type.fromByteBuffer b
                catch e
                    console.error("Error reading #{@operation_name}.#{field} in data:")
                    b.printDebug()
                    throw e
        
        catch error
            EC.throw @operation_name+'.'+field, error
        
        object
    
    appendByteBuffer: (b, object) ->
        field = null
        try
            for field in Object.keys @types
                type = @types[field]
                type.appendByteBuffer b, object[field]
        
        catch error
            try
                EC.throw @operation_name+'.'+field+" = "+
                    JSON.stringify(object[field]), error
            catch e # circular ref
                EC.throw @operation_name+'.'+field+" = "+
                    object[field], error
        return
    
    fromObject: (serialized_object)->
        result = {}
        field = null
        try
            for field in Object.keys @types
                type = @types[field]
                value = serialized_object[field]
                #DEBUG value = value.resolve if value.resolve
                #DEBUG console.log('... value',field,value)
                object = type.fromObject value
                result[field] = object
            
        catch error
            EC.throw @operation_name+'.'+field, error
        
        result
    
    toObject: (serialized_object, debug = {})->
        result = {}
        field = null
        try
            for field in Object.keys @types
                type = @types[field]
                object = type.toObject serialized_object?[field], debug
                result[field] = object
                if(config.hex_dump)
                    b = new ByteBuffer ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN
                    type.appendByteBuffer(b, serialized_object?[field])
                    b = b.copy 0, b.offset
                    console.error(
                        @operation_name+'.'+field
                        b.toHex()
                    )
        catch error
            EC.throw @operation_name+'.'+field, error
        
        result
    
    
    # <helper_functions>
    
    fromHex: (hex) ->
        b = ByteBuffer.fromHex hex, ByteBuffer.LITTLE_ENDIAN
        @fromByteBuffer b
    
    toHex: (object) ->
        b=@toByteBuffer object
        b.toHex()
    
    toByteBuffer: (object) ->
        b = new ByteBuffer ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN
        @appendByteBuffer b, object
        b.copy 0, b.offset
    
    toBuffer: (object)->
        new Buffer(@toByteBuffer(object).toBinary(), 'binary')
    
    # </helper_functions>

module.exports = Serializer

