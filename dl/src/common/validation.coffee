
module.exports =

    ###*
    Account names may contain one or more names separated by a dot.
    Each name needs to start with a letter and may contain
    numbers, or well placed dashes.
    
    @see graphene/libraries/chain/protocol/account.cpp is_valid_name
    ###
    is_account_name: (value)->
        return no if is_empty value
        length = value.length
        return no if length < 3 or length > 63
        for label in value.split('.')
            if !(
                # Starts with a letter, has only letters, digits, and dashes
                /^[a-z][a-z0-9-]*$/.test(label) and
                # Only one dash in a row
                ! /--/.test(label) and
                # Ends with letter or digit
                /[a-z0-9]$/.test(label)
            )
                return false
        return true
    
    is_account_name_error: (value, allow_too_short = false)->
        suffix = "Account name should "
        return suffix + "not be empty." if is_empty value
        length = value.length
        return suffix + "be longer." if ( ! allow_too_short and length < 3)
        return suffix + "be shorter." if length > 63
        suffix = "Each account segment should " if /\./.test(value)
        for label in value.split('.')
            return suffix + "start with a letter." unless /^[a-z]/.test(label)
            return suffix + "have only letters, digits, or dashes." unless /^[a-z0-9-]*$/.test(label)
            return suffix + "have only one dash in a row." if /--/.test(label)
            return suffix + "end with a letter or digit." unless /[a-z0-9]$/.test(label)
        return null
    
    is_cheap_name: (account_name)->
        /[0-9]/.test(account_name) or
        not /[aeiouy]/.test(account_name) or
        /[\.-]/.test(account_name)
    
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
