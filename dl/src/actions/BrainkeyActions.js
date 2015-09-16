import alt from "alt-instance"

class BrainkeyActions {
    
    setBrainKey(brnkey) {
        this.dispatch(brnkey)
    }
    
}

var BrainkeyActionsWrapped = alt.createActions(BrainkeyActions)
export default BrainkeyActionsWrapped