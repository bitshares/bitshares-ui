import idb_helper from "../idb-helper"
import t from "tcomb"
import iDB from "idb-instance"

export var BalanceClaimTcomb = t.struct({
    chain_balance_record: t.Obj,
    private_key_id: t.Num,
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
            balance_claim.digest = digest
            var request = store.put(balance_claim)
            var p = idb_helper.on_request_end(request)
            ps.push(p)
        }
        return Promise.all(ps)
    }
    
    getBalanceClaims_Unclaimed() {
        return new Promise((resolve, reject) => {
            var balances = []
            var p = idb_helper.cursor("balance_claims", cursor => {
                if( ! cursor) return balances
                var balance_claim = cursor.value
                if(balance_claim.digest) {
                    cursor.continue()
                    return
                }
                balances.push(balance_claim)
                cursor.continue()
            })
            resolve(p)
        })
    }

}
module.exports = new BalanceClaimStore()
