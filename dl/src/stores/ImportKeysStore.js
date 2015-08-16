import alt from "alt-instance"

import ImportKeysActions from "actions/ImportKeysActions"


class ImportKeysStore {
    
    constructor() {
        this.bindActions(ImportKeysActions)
    }
    
    onChange() {}

}

export var ImportKeysStoreWrapped = alt.createStore(ImportKeysStore)
export default ImportKeysStoreWrapped
