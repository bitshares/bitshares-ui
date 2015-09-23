import alt from "alt-instance"

class BalanceClaimActiveActions {
    
    setPubkeys(pubkeys) {
        this.dispatch(pubkeys)
    }
    
    setSelectedBalanceClaims(selected_balances) {
        this.dispatch(selected_balances)
    }

}

var BalanceClaimActiveActionsWrapped = alt.createActions(BalanceClaimActiveActions)
export default BalanceClaimActiveActionsWrapped
