import {createToken, checkToken} from '../index'
import assert from "assert"

describe('time-token', () => {
    it('seeded_token', done => {
        let token = createToken("seed")
        assert(token.length)
        let result = checkToken(token)
        assert.equal(true, result.valid)
        assert.equal("seed", result.seed)
        assert.equal(null, result.error)
        done()
    })
    it('non_seeded_token', done => {
        let token = createToken("seed", false)
        assert(token.length)
        let result = checkToken(token, "seed")
        assert.equal(true, result.valid)
        assert.equal("seed", result.seed)
        assert.equal(null, result.error)
        done()
    })
/*
    it('invalid_tokens', done => {
        let token = createToken("seed")
        let result = checkToken(token+'a')
        assert.equal(false, result.valid)
        assert.equal(null, result.seed)
        assert.equal('unmatched', result.error)
        
        result = checkToken('a'+token)
        assert.equal(false, result.valid)
        assert.equal(null, result.seed)
        assert.equal('unmatched', result.error)
        
        result = checkToken('a'+token.substring(1))
        assert.equal(false, result.valid)
        assert.equal(null, result.seed)
        assert.equal('unmatched', result.error)
        done()
    })
*/
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
