import alt from "alt-instance"

import ImportKeysActions from "actions/ImportKeysActions"


class ImportKeysStore {
    
    constructor() {
        this.bindActions(ImportKeysActions)
    }
    
    onSaved() {}

}

export var ImportKeysStoreWrapped = alt.createStore(ImportKeysStore)
export default ImportKeysStoreWrapped
