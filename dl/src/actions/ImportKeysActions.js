import alt from "alt-instance"

import BalanceClaimActions from "actions/BalanceClaimActions"

class ImportKeysActions {
    
    change() {
        this.dispatch()
    }
    
}


var ImportKeysActionsWrapped = alt.createActions(ImportKeysActions)
export default ImportKeysActionsWrapped
