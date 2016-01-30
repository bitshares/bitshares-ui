var ByteBuffer = require('bytebuffer');

module.exports=function(type){

    return {fromHex(hex) {
        var b = ByteBuffer.fromHex(hex, ByteBuffer.LITTLE_ENDIAN);
        return type.fromByteBuffer(b);
    },
    
    toHex(object) {
        var b=toByteBuffer(type, object);
        return b.toHex();
    },
    
    fromBuffer(buffer){
        var b = ByteBuffer.fromBinary(buffer.toString(), ByteBuffer.LITTLE_ENDIAN);
        return type.fromByteBuffer(b);
    },
    
    toBuffer(object){
        return new Buffer(toByteBuffer(type, object).toBinary(), 'binary');
    },
    
    fromBinary(string){
        var b = ByteBuffer.fromBinary(string, ByteBuffer.LITTLE_ENDIAN);
        return type.fromByteBuffer(b);
    },
    
    toBinary(object) {
        return toByteBuffer(type, object).toBinary();
    }
    };
};

var toByteBuffer=function(type, object){
    var b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    type.appendByteBuffer(b, object);
    return b.copy(0, b.offset);
};
