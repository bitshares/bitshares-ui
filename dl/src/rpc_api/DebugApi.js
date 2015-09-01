//var helper = require('../chain/transaction_helper')
//var ops = require('../chain/signed_transaction')
var type = require('../chain/serializer_operation_types')
var v = require('../chain/serializer_validation')
var Serializer = require('../chain/serializer')
var config = require('../chain/serializer_config')
var PrivateKey = require('../ecc/key_private')
var ApplicationApi = require('./ApplicationApi')

class DebugApi {
    
    set_hex_dump(flag = !config.hex_dump) {
        return config.hex_dump = flag
    }
    
    type(operation_name) {
        v.required(operation_name, "operation_name")
        var operation_type = type[operation_name]
        v.required(operation_type, "unknown operation name " + operation_name)
        return operation_type
    }
    
    template(operation_name, debug = {use_default: true, annotate: false}) {
        var operation_type = this.type(operation_name)
        return operation_type.toObject(undefined, debug)
    }
    
    hex_dump(operation_name, object) {
        var operation_type = this.type(operation_name)
        v.required(object, "transaction json object")
        var operation = operation_type.fromObject(object)
        var hex_dump = config.hex_dump
        try {
            config.hex_dump = true
            return operation_type.toObject(operation)
        } finally {
            config.hex_dump = hex_dump
        }
    }
    
}

module.exports = DebugApi
