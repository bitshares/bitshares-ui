import {createToken, checkToken, extractSeed, validToken} from '../index'
import assert from "assert"

describe('time-token', () => {
    
    it("validToken", ()=> {
        let token = createToken("seed")
        assert(validToken(token), "validToken")
    })
    
    it('checkToken_Secret', () => {
        let token = createToken("seed")
        assert(token.length)
        let result = checkToken(token)
        assert.equal(true, result.valid, result.error)
        assert.equal("seed", result.seed)
        assert.equal(null, result.error, "error")
    })
    
    it('non_seeded_token', () => {
        let token = createToken("seed", false)
        assert(token.length)
        let result = checkToken(token, "seed")
        assert.equal(true, result.valid)
        assert.equal("seed", result.seed)
        assert.equal(null, result.error)
    })
    
    it("extractSeed", ()=> {
        let token = createToken("seed")
        assert.equal("seed", extractSeed(token))
        assert.equal(undefined, extractSeed(token+"a"))
    })

    
    it('invalid_tokens', done => {
        let token = createToken("seed")
        let result = checkToken(token+'a')
        assert.equal(false, result.valid)
        assert.equal(null, result.seed)
        assert(result.error)
        done()
    })

    it('expired_token', done => {
        let old_expire = process.env.npm_config__graphene_time_token_expire_min
        try {
            process.env.npm_config__graphene_time_token_expire_min = 0
            let token = createToken("seed")
            let result = checkToken(token)
            assert.equal(false, result.valid)
            assert.equal(null, result.seed)
            assert.equal("expired", result.error)
        } finally {
            process.env.npm_config__graphene_time_token_expire_min = old_expire
            done()
        }
    })
    it('non_expired_token', done => {
        let old_expire = process.env.npm_config__graphene_time_token_expire_min
        try {
            process.env.npm_config__graphene_time_token_expire_min = 1
            let token = createToken("seed")
            let result = checkToken(token)
            assert.equal(true, result.valid)
            assert.equal("seed", result.seed)
            assert.equal(null, result.error)
        } finally {
            process.env.npm_config__graphene_time_token_expire_min = old_expire
            done()
        }
    })
})
