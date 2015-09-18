import alt from "alt-instance"

import ImportKeysActions from "actions/ImportKeysActions"

class ImportKeysStore {
    
    constructor() {
        this.bindActions(ImportKeysActions)
    }
    
    onSetStatus(status) {
        this.setState({status})
    }

}

export var ImportKeysStoreWrapped = alt.createStore(ImportKeysStore, "ImportKeysStore");
export default ImportKeysStoreWrapped
