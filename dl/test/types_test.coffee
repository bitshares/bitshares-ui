Convert = require '../src/chain/serializer_convert'

assert = require 'assert'
type = require '../src/chain/serializer_types'
p = require '../src/common/precision'
Long = require '../src/common/long'

#so_type = require '../src/chain/serializer_operation_types'

describe "types", ->
    
    it "vote_id",->
        toHex=(id)->
            vote = type.vote_id.fromObject id
            Convert(type.vote_id).toHex vote
        assert.equal "ff000000", toHex "255:0"
        assert.equal "00ffffff", toHex "0:"+0xffffff
        out_of_range=(id)->
            try
                toHex id
                assert false, 'should have been out of range'
            catch e
                assert e.message.indexOf('out of range') isnt -1
        out_of_range "0:"+(0xffffff+1)
        out_of_range "256:0"
        return
    
    it "set", ->
        bool_set = type.set type.bool
        assert.equal "03010001", Convert(bool_set).toHex [1,0,1]
        return
    
    it "precision number strings", ->
        check=(input_string, precision, output_string)->
            assert.equal(
                output_string
                p._internal.decimal_precision_string(
                    input_string
                    precision
                )
            )
        
        check(
            "12345678901234567890123456789012345678901234567890.12345",5
            "1234567890123456789012345678901234567890123456789012345"
        )
        check "",     0,      "0"
        check "0",    0,      "0"
        check "-0",   0,      "0"
        check "-00",  0,      "0"
        check "-0.0", 0,      "0"
        check "-",    0,      "0"
        check "1",    0,      "1"
        check "11",   0,      "11"
        
        overflow ()-> check ".1", 0, ""
        overflow ()-> check "-.1", 0, ""
        overflow ()-> check "0.1", 0, ""
        overflow ()-> check "1.1", 0, ""
        overflow ()-> check "1.11", 1, ""
        
        check "",     1,      "00"
        check "1",    1,      "10"
        check "1.1",  1,      "11"
        check "-1",   1,      "-10"
        check "-1.1", 1,      "-11"
        return
    
    it "precision number long", ->
        assert.equal(
            Long.MAX_VALUE.toString()
            p.to_bigint64(
                Long.MAX_VALUE.toString(), _precision = 0
            ).toString()
            "to_bigint64 MAX_VALUE mismatch"
        )
            
        # Long.MAX_VALUE.toString() == 9223372036854775807
        # Long.MAX_VALUE.toString() +1 9223372036854775808
        overflow ()-> p.to_bigint64(
            '9223372036854775808', _precision = 0
        )
        
        assert.equal "0", p.to_string64(Long.ZERO, 0)
        assert.equal "00", p.to_string64(Long.ZERO, 1)
        
        overflow ()-> assert.equal(
            "92233720368547758070"
            p.to_string64(Long.MAX_VALUE, 1)
        )
        return
    
overflow = (f)->
    try
        f()
        assert false, "expecting overflow"
    catch e
        assert(
            e.toString().indexOf("overflow") isnt -1
            "expecting overflow"
        )
