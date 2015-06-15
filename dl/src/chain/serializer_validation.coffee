ChainTypes = require './chain_types.coffee'
Long = require('../common/bytebuffer').Long
BigInteger = require('bigi')

MAX_SAFE_INT = 9007199254740991
MIN_SAFE_INT =-9007199254740991

###*
Most validations are skipped and the value returned unchanged when 
an empty string, null, or undefined is encountered (except "required"). 

Validations support a string format for dealing with large numbers.
###
module.exports = _my =

    is_empty: is_empty=(value)->
        value is null or value is undefined
    
    required: (value, field_name="")->
        if is_empty value
            throw new Error "value required for #{field_name}: #{value}"
        value
    
    require_long: (value, field_name="")->
        unless Long.isLong value
            throw new Error "Long value required for #{field_name}: #{value}"
        value
    
    string: (value)->
        return value if is_empty value
        if typeof value isnt "string"
            throw new Error "string required: #{value}"
        value
    
    number: (value)->
        return value if is_empty value
        if typeof value isnt "number"
            throw new Error "number required: #{value}"
        value
    
    whole_number: (value, field_name="")->
        return value if is_empty value
        if /\./.test value
            throw new Error "whole number required #{field_name}: #{value}"
        value
    
    unsigned: (value, field_name="")->
        return value if is_empty value
        if /-/.test value
            throw new Error "unsigned required #{field_name}: #{value}"
        value
    
    is_digits: is_digits=(value)->
        return yes if typeof value is "numeric"
        /^[0-9]+$/.test value
    
    to_number: to_number=(value, field_name="")->
        return value if is_empty value
        _my.no_overflow53 value, field_name
        int_value = if typeof value is "number"
            value
        else
            parseInt value
        int_value
    
    to_long:(value, field_name="")->
        return value if is_empty value
        return value if Long.isLong value
        
        _my.no_overflow64 value, field_name
        if typeof value is "number"
            value = ""+value
        Long.fromString value
    
    to_string:(value, field_name="")->
        return value if is_empty value
        return value if typeof value is "string"
        if typeof value is "number"
            _my.no_overflow53 value, field_name
            return ""+value
        if Long.isLong value
            return value.toString()
        throw "unsupported type #{field_name}: (#{typeof value}) #{value}"
    
    require_test:(regex, value, field_name="")->
        return value if is_empty value
        unless regex.test value
            throw new Error "unmatched #{regex} #{field_name}: #{value}"
        value
    
    require_match:(regex, value, field_name="")->
        return value if is_empty value
        match = value.match regex
        if match is null
            throw new Error "unmatched #{regex} #{field_name}: #{value}"
        match
    
    # Does not support over 53 bits
    require_range:(min,max,value, field_name="")->
        return value if is_empty value
        number = to_number value
        if value < min or value > max
            throw new Error "out of range #{value} #{field_name}: #{value}"
        value
    
    require_object_type: require_object_type=(
        reserved_spaces = 1, type, value
        field_name=""
    )->
        return value if is_empty value
        object_type = ChainTypes.object_type[type]
        unless object_type
            throw new Error "Unknown object type #{type} #{field_name}: #{value}"
        re = new RegExp "#{reserved_spaces}\.#{object_type}\.[0-9]+$"
        unless re.test value
            throw new Error "Expecting #{type} in format "+
                "#{reserved_spaces}.#{object_type}.[0-9]+ "+
                "instead of #{value} #{field_name}: #{value}"
        value
    
    get_instance: get_instance=(reserve_spaces, type, value, field_name)->
        return value if is_empty value
        require_object_type reserve_spaces, type, value, field_name
        to_number value.split('.')[2]
    
    require_relative_type: require_relative_type=(type, value, field_name)->
        require_object_type 0, type, value, field_name
        value
    
    get_relative_instance: get_relative_instance=(type, value, field_name)->
        return value if is_empty value
        require_object_type 0, type, value, field_name
        to_number value.split('.')[2]
    
    require_protocol_type: require_protocol_type=(type, value, field_name)->
        require_object_type 1, type, value, field_name
        value
    
    get_protocol_instance: get_protocol_instance=(type, value, field_name)->
        return value if is_empty value
        require_object_type 1, type, value, field_name
        to_number value.split('.')[2]
    
    require_implementation_type: require_implementation_type=(type, value, field_name)->
        require_object_type 2, type, value, field_name
        value
    
    get_implementation_instance: get_implementation_instance=(type, value, field_name)->
        return value if is_empty value
        require_object_type 2, type, value, field_name
        to_number value.split('.')[2]

    # signed / unsigned decimal
    no_overflow53: (value, field_name="")->
        if typeof value is "number"
            if value > MAX_SAFE_INT or value < MIN_SAFE_INT
                throw new Error "overflow #{field_name}: #{value}"
            return
        if typeof value is "string"
            int = parseInt value
            if value > MAX_SAFE_INT or value < MIN_SAFE_INT
                throw new Error "overflow #{field_name}: #{value}"
            return
        if Long.isLong value
            # typeof value.toInt() is 'number'
            no_overflow53 value.toInt(), field_name
            return
        throw "unsupported type #{field_name}: (#{typeof value}) #{value}"
    
    # signed / unsigned whole numbers only
    no_overflow64: (value, field_name="")->
        # https://github.com/dcodeIO/Long.js/issues/20
        return if Long.isLong value
        
        # BigInteger#isBigInteger https://github.com/cryptocoinjs/bigi/issues/20
        if value.t isnt undefined and value.s isnt undefined
            _my.no_overflow64 value.toString(), field_name
            return
        
        if typeof value is "string"
            # remove leading zeros, will cause a false positive
            value = value.replace /^0+/,''
            # remove trailing zeros
            while /0$/.test value
                value = value.substring 0, value.length - 1
            if /\.$/.test value
                # remove trailing dot
                value = value.substring 0, value.length - 1
            value = "0" if value is ""
            long_string = Long.fromString(value).toString()
            if long_string isnt value.trim()
                throw new Error "overflow #{field_name}: #{value}"
            return
        if typeof value is "number"
            if value > MAX_SAFE_INT or value < MIN_SAFE_INT
                throw new Error "overflow #{field_name}: #{value}"
            return
            
        throw "unsupported type #{field_name}: (#{typeof value}) #{value}"
