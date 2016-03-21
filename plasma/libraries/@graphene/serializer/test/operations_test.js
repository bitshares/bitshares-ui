import { fromJS } from "immutable"
import { PrivateKey, PublicKey, Address } from "@graphene/ecc"
import { Long } from "bytebuffer"
var assert = require('assert');
var Serilizer = require("../src/serializer")
var types = require('../src/types');
var ops = require('../src/operations');

describe("operation test", ()=> {
    
    it("templates", ()=> {
        for(let op in ops) {
            switch(op) {
                case "operation" : continue
            }
            template(ops[op])
        }
    })
})

function template(op) {
    
    assert(op.toObject({}, {use_default: true}))
    assert(op.toObject({}, {use_default: true, annotate: true}))
    
    // sample json
    let obj = op.toObject({}, {use_default: true, annotate: false})
    console.log(" ", op.operation_name, "\t", JSON.stringify(obj), "\n")

}