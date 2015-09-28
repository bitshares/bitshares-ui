import alt from "alt-instance"

class BalanceClaimActiveActions {
    
    setPubkeys(pubkeys) {
        this.dispatch(pubkeys)
    }
    
    setSelectedBalanceClaims(selected_balances) {
        this.dispatch(selected_balances)
    }
    
    claimAccountChange(claim_account_name) {
        this.dispatch(claim_account_name)
    }

}

var BalanceClaimActiveActionsWrapped = alt.createActions(BalanceClaimActiveActions)
export default BalanceClaimActiveActionsWrapped
