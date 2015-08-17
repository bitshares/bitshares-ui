import alt from "alt-instance"

class BalanceClaimActions {
    
    add(params) {
        this.dispatch(params)
    }
    
    refreshBalanceClaims() {
        this.dispatch()
    }
    
    loadMyAccounts() {
        this.dispatch()
    }
}

var BalanceClaimActionsWrapped = alt.createActions(BalanceClaimActions)
export default BalanceClaimActionsWrapped
