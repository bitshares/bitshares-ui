import assert from "assert"
import { toImpliedDecimal } from "../src/number_utils"

describe("Number utils", () => {
    

    it("to implied decimal", ()=> {
        assert.equal("1", toImpliedDecimal(1, 0))
        assert.equal("10", toImpliedDecimal(1, 1))
        assert.equal("100", toImpliedDecimal(1, 2))
        assert.equal("10", toImpliedDecimal(".1", 2))
        assert.equal("10", toImpliedDecimal("0.1", 2))
        assert.equal("10", toImpliedDecimal("00.1", 2))
        assert.equal("10", toImpliedDecimal("00.10", 2))
        assert.throws(()=> toImpliedDecimal("00.100", 2))
        assert.throws(()=> toImpliedDecimal(9007199254740991 + 1, 1))
    })
        

})