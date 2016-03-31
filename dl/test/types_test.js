var Convert = require('../src/chain/serializer_convert');
var Long = require('bytebuffer').Long;

var assert = require('assert');
var type = require('../src/chain/serializer_types');
var p = require('../src/common/precision');
var th = require('./test_helper');

// import { is } from "immutable"

describe("types", function() {

    it("vote_id",function() {
        var toHex=function(id){
            var vote = type.vote_id.fromObject(id);
            return Convert(type.vote_id).toHex(vote);
        };
        assert.equal("ff000000", toHex("255:0"));
        assert.equal("00ffffff", toHex("0:"+0xffffff));
        var out_of_range=function(id){
            try {
                toHex(id);
                return assert(false, 'should have been out of range');
            } catch (e) {
                return assert(e.message.indexOf('out of range') !== -1);
            }
        };
        out_of_range("0:"+(0xffffff+1));
        out_of_range("256:0");

    });

    it("set sort", function() {
        var bool_set = type.set(type.bool);
        // Note, 1,0 sorts to 0,1
        assert.equal("020001", Convert(bool_set).toHex([1,0]));
        th.error("duplicate (set)", function() { return Convert(bool_set).toHex([1,1]); });

    });

    it("string sort", function() {
        var setType = type.set(type.string);
        var set = setType.fromObject(["a","z","m"])
        var setObj = setType.toObject(set)
        assert.deepEqual(["a","m","z"], setObj, "not sorted")
    });

    it("map sort", function() {
        var bool_map = type.map(type.bool, type.bool);
        // 1,1 0,0   sorts to   0,0  1,1
        assert.equal("0200000101", Convert(bool_map).toHex([[1,1],[0,0]]));
        th.error("duplicate (map)", function() { return Convert(bool_map).toHex([[1,1],[1,1]]); });
    })

    it("public_key sort", function() {
        let mapType = type.map(type.public_key, type.uint16)
        let map = mapType.fromObject([//not sorted
            ["GPH6FHYdi17RhcUXJZr5fxZm1wvVCpXPekiHeAEwRHSEBmiR3yceK",0],
            ["GPH5YdgWfAejDdSuq55xfguqFTtbRKLi2Jcz1YtTsCzYgdUYXs92c",0],
            ["GPH7AGnzGCAGVfFnyvPziN67mfuHx9rx89r2zVoRGW1Aawim1f3Qt",0],
        ])
        let mapObject = mapType.toObject(map)
        assert.deepEqual(mapObject, [ // sorted (witness_node sorts assending by "address" (not pubkey))
            ["GPH7AGnzGCAGVfFnyvPziN67mfuHx9rx89r2zVoRGW1Aawim1f3Qt",0],
            ["GPH5YdgWfAejDdSuq55xfguqFTtbRKLi2Jcz1YtTsCzYgdUYXs92c",0],
            ["GPH6FHYdi17RhcUXJZr5fxZm1wvVCpXPekiHeAEwRHSEBmiR3yceK",0],
        ])
    })



    it("type_id sort", function() {
        // map (protocol_id_type "account"), (uint16)
        let t = type.map(type.protocol_id_type("account"), type.uint16);
        assert.deepEqual( t.fromObject([[1,1],[0,0]]), [[0,0],[1,1]], 'did not sort' )
        assert.deepEqual( t.fromObject([[0,0],[1,1]]), [[0,0],[1,1]], 'did not sort' )
    });

    it("precision number strings", function() {
        var check=function(input_string, precision, output_string){
            return assert.equal(
                output_string,
                p._internal.decimal_precision_string(
                    input_string,
                    precision
                )
            );
        };

        check(
            "12345678901234567890123456789012345678901234567890.12345",5,
            "1234567890123456789012345678901234567890123456789012345"
        );
        check("",     0,      "0");
        check("0",    0,      "0");
        check("-0",   0,      "0");
        check("-00",  0,      "0");
        check("-0.0", 0,      "0");
        check("-",    0,      "0");
        check("1",    0,      "1");
        check("11",   0,      "11");

        overflow(function(){ return check(".1", 0, ""); });
        overflow(function(){ return check("-.1", 0, ""); });
        overflow(function(){ return check("0.1", 0, ""); });
        overflow(function(){ return check("1.1", 0, ""); });
        overflow(function(){ return check("1.11", 1, ""); });

        check("",     1,      "00");
        check("1",    1,      "10");
        check("1.1",  1,      "11");
        check("-1",   1,      "-10");
        check("-1.1", 1,      "-11");

    });

    return it("precision number long", function() {
        var _precision;
        assert.equal(
            Long.MAX_VALUE.toString(),
            p.to_bigint64(
                Long.MAX_VALUE.toString(), _precision = 0
            ).toString(),
            "to_bigint64 MAX_VALUE mismatch"
        );

        // Long.MAX_VALUE.toString() == 9223372036854775807
        // Long.MAX_VALUE.toString() +1 9223372036854775808
        overflow(function(){ return p.to_bigint64(
            '9223372036854775808', _precision = 0
        );
        });

        assert.equal("0", p.to_string64(Long.ZERO, 0));
        assert.equal("00", p.to_string64(Long.ZERO, 1));

        overflow(function(){ return p.to_bigint64(
            '92233720368547758075', _precision = 1
        );
        });

    });
});

var overflow = function(f){ return th.error("overflow", f); };
