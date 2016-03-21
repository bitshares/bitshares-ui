import { PublicKey } from "@graphene/ecc"

class FastParser {
    
    static fixed_data(b, len, buffer) {
        if (!b) {
            return;
        }
        if (buffer) {
            let data = buffer.slice(0, len).toString('binary');
            b.append(data, 'binary');
            while (len-- > data.length) {
                b.writeUint8(0);
            }
        } else {
            let b_copy = b.copy(b.offset, b.offset + len);
            b.skip(len);
            return new Buffer(b_copy.toBinary(), 'binary');
        }
    }
        

    static public_key(b, public_key) {
        if (!b) { return; }
        if (public_key) {
            var buffer = public_key.toBuffer();
            b.append(buffer.toString('binary'), 'binary');
            return;
        } else {
            buffer = FastParser.fixed_data(b, 33);
            return PublicKey.fromBuffer(buffer);
        }
    }

    static ripemd160(b, ripemd160) {
        if (!b) { return; }
        if (ripemd160) {
            FastParser.fixed_data(b, 20, ripemd160);
            return;
        } else {
            return FastParser.fixed_data(b, 20);
        }
    }
    
    static time_point_sec(b, epoch) {
        if (epoch) {
            epoch = Math.ceil(epoch / 1000);
            b.writeInt32(epoch);
            return;
        } else {
            epoch = b.readInt32(); // fc::time_point_sec
            return new Date(epoch * 1000);
        }
    }
}
    
module.exports = FastParser;
