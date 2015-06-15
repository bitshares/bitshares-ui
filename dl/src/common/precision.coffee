v = require '../chain/serializer_validation'
BigInteger = require 'bigi'

module.exports = _my =

    # Result may be used for int64 types (like transfer amount).  Asset's
    # precision is used to convert the number to a whole number with an implied
    # decimal place.
    
    # "1.01" with a precision of 2 returns long 101
    # See http://cryptocoinjs.com/modules/misc/bigi/#example
    to_bigint64:(number_or_string, precision, error_info = "")->
        long = _private.to_long64 number_or_string, precision, error_info
        BigInteger(long.toString())
    
    # 101 string or long with a precision of 2 returns "1.01" 
    to_string64: (number_or_string, precision, error_info = "")->
        v.required number_or_string, error_info
        v.number precision, error_info
        number_long = v.to_long number_or_string, error_info
        string64 = _private.decimal_precision_string(
            number_long
            precision
            error_info
        )
        v.no_overflow64 string64, error_info
        string64
    
# _private is exported for unit tests and low-level transaction code
module.exports._private = _private =
    
    # "1.01" with a precision of 2 returns long 101
    to_long64: (number_or_string, precision, error_info = "")->
        v.required number_or_string, "number_or_string " + error_info
        v.required precision, "precision " + error_info
        v.to_long _private.decimal_precision_string(
            number_or_string
            precision
            error_info
        )
    
    decimal_precision_string: (number, precision, error_info = "")->
        v.required number, "number " + error_info
        v.required precision, "precision " + error_info
        
        number_string = v.to_string number
        number_string = number_string.trim()
        precision = v.to_number precision
        
        # remove leading zeros (not suffixing)
        number_parts = number_string.match /^-?0*([0-9]*)\.?([0-9]*)$/
        unless number_parts
            throw new Error "Invalid number: #{number_string} #{error_info}"
        
        sign = if number_string.charAt(0) is '-' then '-' else ''
        int_part = number_parts[1]
        decimal_part = number_parts[2]
        decimal_part = "" unless decimal_part
        
        # remove trailing zeros
        while /0$/.test decimal_part
            decimal_part = decimal_part.substring 0, decimal_part.length - 1
        
        zero_pad_count = precision - decimal_part.length
        if zero_pad_count < 0
            throw new Error "overflow, up to #{precision} decimals may be used #{error_info}"
        
        sign = "" if sign is "-" and not /[1-9]/.test(int_part + decimal_part)
        int_part = "0" if int_part is ""
        for i in [0...zero_pad_count] by 1
            decimal_part += "0"
        
        sign + int_part + decimal_part
