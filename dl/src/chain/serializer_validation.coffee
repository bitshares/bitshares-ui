ChainTypes = require './chain_types.coffee'
Long = require('../common/bytebuffer').Long

MAX_SAFE_INT = 9007199254740991

module.exports=

    is_empty: is_empty=(value)->
        value is null or value is undefined
    
    required: required=(value, field_name="")->
        if is_empty value
            throw new Error "value required for #{field_name}: #{value}"
        value
    
    require_string: require_string=(value)->
        return value if is_empty value
        if typeof value isnt "string"
            throw new Error "string required: #{value}"
        value
    
    require_number: require_number=(value)->
        return value if is_empty value
        if typeof value isnt "number"
            throw new Error "number required: #{value}"
        value
    
    ###
        Allows a string of digits (potentially very large number) or 
        a number type.  An empty string or empty value is allowed.
    ###
    require_digits: require_digits=(value, field_name="")->
        return value if typeof value is "numeric"
        unless /^[0-9]*$/.test value
            throw new Error "Only digits allowed in #{field_name}: #{value}"
        value
    
    is_digits: is_digits=(value)->
        return yes if typeof value is "numeric"
        /^[0-9]+$/.test value

    
    to_number: to_number=(value)->
        return value if is_empty value
        int_value = if typeof value is "number"
            value
        else
            parseInt value
        if int_value > MAX_SAFE_INT
            throw new Error "overflow #{value}"
        int_value
    
    to_long:(value, field_name="")->
        return value if is_empty value
        return value if Long.isLong value
        @require_digits value, field_name
        if typeof value is "number"
            if value > MAX_SAFE_INT
                throw new Error "overflow #{value}"
            value = ""+value
        Long.fromString value
    
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
    
    require_range:(min,max,value, field_name="")->
        return value if is_empty value
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
        unless re.test require_string value
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
