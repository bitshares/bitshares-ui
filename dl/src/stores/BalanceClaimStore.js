import idb_helper from "../idb-helper"
import t from "tcomb"
import iDB from "idb-instance"

import Apis from "rpc_api/ApiInstances"

var api = Apis.instance()

export var BalanceClaimTcomb = t.struct({
    chain_balance_record: t.Obj,
    private_key_id: t.Num,
    is_claimed: t.maybe(t.Bool),
    digest: t.maybe(t.Str)
})

class BalanceClaimStore {
    
    transaction_update() {
        var transaction = iDB.instance().db().transaction(
            ["balance_claims"], "readwrite"
        )
        return transaction
    }
    
    add(balance_claim, transaction) {
        BalanceClaimTcomb(balance_claim)
        return idb_helper.add(
            transaction.objectStore("balance_claims"),
            balance_claim
        )
    }
    
    setDigest(balance_claims, digest) {
        var transaction = this.transaction_update()
        var store = transaction.objectStore("balance_claims")
        var ps = []
        for(let balance_claim of balance_claims) {
            balance_claim = BalanceClaimTcomb.update(
                BalanceClaimTcomb(balance_claim),
                { digest: { '$set': digest } }
            )
            var request = store.put(balance_claim)
            var p = idb_helper.on_request_end(request)
            ps.push(p)
        }
        return Promise.all(ps)
    }
    
    saveBalanceClaims(balance_claims) {
        var transaction = this.transaction_update()
        var store = transaction.objectStore("balance_claims")
        var ps = []
        for(let balance_claim of balance_claims) {
            var request = store.put(balance_claim)
            var p = idb_helper.on_request_end(request)
            ps.push(p)
        }
        return Promise.all(ps)
    }
    
    getBalanceClaims() {
        return new Promise((resolve, reject) => {
            var balance_claims = [], balance_ids = []
            var p = idb_helper.cursor("balance_claims", cursor => {
                if( ! cursor) return
                var balance_claim = cursor.value
                balance_claims.push( balance_claim )
                balance_ids.push(balance_claim.chain_balance_record.id)
                cursor.continue()
            }).then( ()=> {
                //DEBUG console.log('... refresh')
                if( ! balance_claims.length)
                    return balance_claims
                
                var db = api.db_api()
                return db.exec("get_objects", [balance_ids]).then( result => {
                    for(let i = 0; i < result.length; i++) {
                        var balance_claim = balance_claims[i]
                        var chain_balance_record = result[i]
                        //DEBUG console.log('... chain_balance_record',chain_balance_record)
                        if( ! chain_balance_record) {
                            balance_claims[i] = BalanceClaimTcomb.update(
                                BalanceClaimTcomb(balance_claim),
                                { is_claimed: { '$set': true } }
                            )
                        } else
                            balance_claims[i] = BalanceClaimTcomb.update(
                                BalanceClaimTcomb(balance_claim),
                                { chain_balance_record:
                                    { '$set': chain_balance_record } }
                            )
                    }
                    this.saveBalanceClaims(balance_claims)
                    return balance_claims
                })
            })
            resolve(p)
        })
    }

}
module.exports = new BalanceClaimStore()
