import alt from "alt-instance"

class BalanceClaimActions {
    
    refreshBalanceClaims() {
        new Promise( resolve =>
            this.dispatch(resolve)
        ).then( ()=>
            BalanceClaimActionsWrapped.refreshComplete()
        )
    }
    
    refreshComplete() {}
    
    add(params) {
        this.dispatch(params)
    }
}

var BalanceClaimActionsWrapped = alt.createActions(BalanceClaimActions)
export default BalanceClaimActionsWrapped
