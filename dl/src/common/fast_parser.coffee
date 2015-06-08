PublicKey = require '../ecc/key_public'

class FastParser
    
    FastParser.fixed_data = (b, len, buffer) ->
        return unless b 
        if buffer
            data = buffer.slice(0, len).toString('binary')
            b.append data, 'binary'
            while len-- > data.length
                b.writeUint8 0
            return
        else
            b_copy = b.copy(b.offset, b.offset + len); b.skip len
            new Buffer(b_copy.toBinary(), 'binary')
    
    FastParser.public_key = (b, public_key) ->
        return unless b
        if public_key
            buffer = public_key.toBuffer()
            b.append(buffer.toString('binary'), 'binary')
            return
        else
            buffer = FastParser.fixed_data b, 33
            PublicKey.fromBuffer buffer
        
    FastParser.ripemd160 = (b, ripemd160) ->
        return unless b
        if ripemd160
            FastParser.fixed_data b, 20, ripemd160
            return
        else
            FastParser.fixed_data b, 20
    
    FastParser.time_point_sec = (b, epoch) ->
        if epoch
            epoch = Math.ceil(epoch / 1000)
            b.writeInt32 epoch
            return
        else
            epoch = b.readInt32() # fc::time_point_sec
            new Date epoch * 1000
    
module.exports = FastParser
