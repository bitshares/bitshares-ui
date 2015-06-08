ByteBuffer = require '../common/bytebuffer'

module.exports=(type)->

    fromHex: (hex) ->
        b = ByteBuffer.fromHex hex, ByteBuffer.LITTLE_ENDIAN
        type.fromByteBuffer b
    
    toHex: (object) ->
        b=toByteBuffer type, object
        b.toHex()
    
    fromBuffer:(buffer)->
        b = ByteBuffer.fromBinary buffer.toString(), ByteBuffer.LITTLE_ENDIAN
        type.fromByteBuffer b
    
    toBuffer: (object)->
        new Buffer(toByteBuffer(type, object).toBinary(), 'binary')
    
    fromBinary:(string)->
        b = ByteBuffer.fromBinary string, ByteBuffer.LITTLE_ENDIAN
        type.fromByteBuffer b
    
    toBinary: (object) ->
        toByteBuffer(type, object).toBinary()

toByteBuffer=(type, object)->
    b = new ByteBuffer ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN
    type.appendByteBuffer b, object
    b.copy 0, b.offset
