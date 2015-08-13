
module.exports =

    ###*
    Valid names are all lower case, start with [a-z] and may
    have "." or "-" in the name along with a single '/'.  The
    next character after a "/", "." or "-" cannot be [0-9] or
    another '.', '-'.
    ###
    is_account_name: (value)->
        return no if is_empty value
        length = value.length
        return no if length < 3 or length > 64
        /^(([a-z][a-z0-9]*([\.-][a-z][a-z0-9]*)*)(\/([a-z][a-z0-9]*([\.-][a-z][a-z0-9]*)*))?)$/.test value
    
    is_cheap_name: (account_name)->
        account_name.length > 8 or
        /[0-9]/.test(account_name) or
        not /[aeiouy]/.test(account_name) or
        /[\.\-/]/.test(account_name)
    
    is_empty_user_input: (value)->
        return yes if is_empty value
        return yes if (value+"").trim() is ""
        return no
    
    required: (value, field_name="")->
        if is_empty value
            throw new Error "value required for #{field_name}: #{value}"
        value

    is_valid_symbol: (value) ->
        return true unless value
        return false unless typeof value == 'string'
        value = value.split '.'
        scam_pattern = /^BIT/
        pattern = /^([A-Z]{3,8})$/
        if value.length == 1
            return !!value[0].match(pattern) and not !!value[0].match(scam_pattern)
        else if value.length == 2
            rest = 12-(value[0].length+1)
            pattern2 = new RegExp('^([A-Z]{3,'+rest+'})$');
            return !!value[0].match(pattern) and !!value[1].match(pattern2)
    
    # ###* @parm1 string wallet_name can have dashes, numbers, or letters ###
    # is_wallet_name: (value)->
    #    /^[-A-Za-z0-9]+$/,test value
    
    #required_string: (value, field_name="")->
    #    if typeof value isnt "string"
    #        throw new Error "string required #{field_name}: #{value}"
    #    value
            
is_empty = (value)->
    return yes if value is null or value is undefined
    return yes if value.length is 0
    return no
