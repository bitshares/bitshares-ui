import alt from "alt-instance"
import BaseStore from "stores/BaseStore"

class ImportKeysStore extends BaseStore {
    
    constructor() {
        super()
        this.state = this._getInitialState()
        this._export("importing")
    }

    _getInitialState() {
        return { importing: false }
    }
    
    importing(importing, callback) {
        this.setState({ importing }, callback)
    }
    
}

export var ImportKeysStoreWrapped = alt.createStore(ImportKeysStore, "ImportKeysStore")
export default ImportKeysStoreWrapped