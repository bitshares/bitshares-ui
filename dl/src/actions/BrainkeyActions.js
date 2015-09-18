import alt from "alt-instance"

class BrainkeyActions {
    
    setBrainkey(brnkey) {
        this.dispatch(brnkey)
    }
    
}

var BrainkeyActionsWrapped = alt.createActions(BrainkeyActions)
export default BrainkeyActionsWrapped