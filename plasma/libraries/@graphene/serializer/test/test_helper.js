var assert = require('assert');

module.exports = {

    print_result(tr_object){
        if (tr_object) {
            console.log('print_result', JSON.stringify(tr_object));
        }
        try {
            var tr = signed_transaction_type.fromObject(tr_object);
            var tr_hex = signed_transaction_type.toHex(tr);
            return ByteBuffer.fromHex(tr_hex).printDebug();
        } catch (e) {
            if (tr_object && tr_object["ref_block_num"]) {
                return console.log("print_result: unparsed or non-transactoin object",e,e.stack);
            }
        }
    },
    
    print_hex(hex){
        console.log('print_hex');
        ByteBuffer.fromHex(hex).printDebug();
        try {
            var tr = signed_transaction_type.fromHex(hex);
            var tr_object = signed_transaction_type.toObject(tr);
            return console.log(JSON.stringify(tr_object));
        } catch (e) {
            return console.log("print_hex: unparsed or non-transactoin object",e,e.stack);
        }
    },
            
    log_error(error){
        if (error.stack) {
            return console.log('ERROR',error.stack);
        } else {
            return console.log('ERROR',error);
        }
    },
    
    error(message_substring, f){
        var fail = false;
        try {
            f();
            fail = true;
        } catch (e) {
            if (e.toString().indexOf(message_substring) === -1) {
                throw new Error("expecting " + message_substring);
            }
        }
        if (fail) {
            throw new Error("expecting " + message_substring);
        }
    }
}