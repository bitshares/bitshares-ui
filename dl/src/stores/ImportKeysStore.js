import alt from "alt-instance"

import ImportKeysActions from "actions/ImportKeysActions"


class ImportKeysStore {
    
    constructor() {
        this.bindActions(ImportKeysActions)
    }
    
    onSaved() {
        //DEBUG console.log('... ImportKeysStore,onSaved')
    }

}

export var ImportKeysStoreWrapped = alt.createStore(ImportKeysStore)
export default ImportKeysStoreWrapped
