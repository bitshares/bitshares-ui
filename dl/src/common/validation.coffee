###*
Valid names are all lower case, start with [a-z] and may
have "." or "-" in the name along with a single '/'.  The
next character after a "/", "." or "-" cannot be [0-9] or
another '.', '-'.
###
is_account_name = (value)->
    return no if is_empty value
    length = value.length
    return no if length < 3 or length > 64
    /^(([a-z][a-z0-9]*([\.-][a-z][a-z0-9]*)*)(\/([a-z][a-z0-9]*([\.-][a-z][a-z0-9]*)*))?)$/.test value

is_cheap_name = (account_name)->
    account_name.length > 8 or
    /[0-9]/.test(account_name) or
    not /[aeiouy]/.test(account_name) or
    /[\.\-/]/.test(account_name)

is_empty = (value)->
    return yes if value is null or value is undefined
    return yes if value.length is 0
    return no

is_empty_user_input = (value)->
    return yes if is_empty value
    return yes if (value+"").trim() is ""
    return no

module.exports = 
    is_account_name: is_account_name
    is_empty: is_empty
    is_empty_user_input: is_empty_user_input
    is_cheap_name: is_cheap_name
