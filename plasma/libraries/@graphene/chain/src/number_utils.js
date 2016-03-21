import assert from "assert"

/**
    Convert 12.34 with a precision of 3 into 12340
    
    @arg {number|string} number - Use strings for large numbers.  This may contain one decimal but no sign
    @arg {number} precision - number of implied decimal places (usually causes right zero padding)
    @return {string} -
*/
export function toImpliedDecimal(number, precision) {
    
    if(typeof number === "number") {
        assert(number <= 9007199254740991, "overflow")
        number = ""+number;
    } else
        if( number.toString )
            number = number.toString()
    
    assert(typeof number === "string", "number should be an actual number or string: " + (typeof number))
    number = number.trim()
    assert(/^[0-9]*\.?[0-9]*$/.test(number), "Invalid decimal number " + number)
    
    let [ whole = "", decimal = ""] = number.split(".")
    
    let padding = precision - decimal.length
    assert(padding >= 0, "Too many decimal digits in " + number + " to create an implied decimal of " + precision)
    
    for(let i = 0; i < padding; i++)
        decimal += "0"
        
    while(whole.charAt(0) === "0")
        whole = whole.substring(1)
    
    return whole + decimal
}
