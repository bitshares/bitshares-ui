import assert from "assert"
import { PrivateKey } from "@graphene/ecc"

var type = require('@graphene/chain').types
var ApplicationApi = require('./ApplicationApi')

class DebugApi {
    
    set_hex_dump(flag = !config.hex_dump) {
        return config.hex_dump = flag
    }
    
    type(operation_name) {
        assert(operation_name, "operation_name")
        var operation_type = type[operation_name]
        assert(operation_type, "unknown operation name " + operation_name)
        return operation_type
    }
    
    template(operation_name, debug = {use_default: true, annotate: false}) {
        var operation_type = this.type(operation_name)
        return operation_type.toObject(undefined, debug)
    }
    
    hex_dump(operation_name, object) {
        var operation_type = this.type(operation_name)
        assert(object, "transaction json object")
        var operation = operation_type.fromObject(object)
        return operation_type.toObject(operation, { hex_dump: true })
    }
    
}

module.exports = DebugApi
