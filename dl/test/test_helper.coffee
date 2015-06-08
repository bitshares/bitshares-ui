

module.exports = th = {}

th.print_result=(tr_object)->
    console.log 'print_result', JSON.stringify tr_object
    try
        tr = signed_transaction_type.fromObject tr_object
        tr_hex = signed_transaction_type.toHex(tr)
        ByteBuffer.fromHex(tr_hex).printDebug()
    catch e
        if tr_object and tr_object["ref_block_num"]
            console.log "print_result: unparsed or non-transactoin object",e,e.stack

th.print_hex=(hex)->
    console.log 'print_hex'
    ByteBuffer.fromHex(hex).printDebug()
    try
        tr = signed_transaction_type.fromHex hex
        tr_object = signed_transaction_type.toObject(tr)
        console.log JSON.stringify tr_object
    catch e
        console.log "print_hex: unparsed or non-transactoin object",e,e.stack
        
th.log_error = (error)->
    console.log 'log_error',error,error.stack
