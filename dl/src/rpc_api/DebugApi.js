var {PrivateKey, Serializer, SerializerValidation, types} = require("graphenejs-lib");
var config = require('../chain/serializer_config')
var ApplicationApi = require('./ApplicationApi')

class DebugApi {
    
    set_hex_dump(flag = !config.hex_dump) {
        return config.hex_dump = flag
    }
    
    type(operation_name) {
        SerializerValidation.required(operation_name, "operation_name")
        var operation_type = types[operation_name]
        SerializerValidation.required(operation_type, "unknown operation name " + operation_name)
        return operation_type
    }
    
    template(operation_name, debug = {use_default: true, annotate: false}) {
        var operation_type = this.type(operation_name)
        return operation_type.toObject(undefined, debug)
    }
    
    hex_dump(operation_name, object) {
        var operation_type = this.type(operation_name)
        SerializerValidation.required(object, "transaction json object")
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
