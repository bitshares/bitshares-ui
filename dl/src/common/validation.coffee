
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

    is_valid_symbol_error: (value) ->
        suffix = "Asset name should "
        return suffix + "not be empty." if is_empty value
        return suffix + "have only one dot." if value.split('.').length > 2
        return suffix + "be longer." if value.length < 3
        return suffix + "be shorter." if value.length > 16
        return suffix + "start with a letter" unless /^[A-Z]/.test value
        return suffix + "end with a letter" unless /[A-Z]$/.test value
        #return "not start with BIT." if /^BIT/.test value # scam_pattern
        return suffix + "contain only letters numbers and perhaps a dot." if /^[A-Z0-9\.]$/.test value
        return null

is_empty = (value)->
    return yes if value is null or value is undefined
    return yes if value.length is 0
    return no
