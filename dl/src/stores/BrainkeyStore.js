import alt from "alt-instance"
import BaseStore from "stores/BaseStore"

class BrainkeyStore extends BaseStore {
    
    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    _getInitialState() {
        return {
            brnkey: ""
        }
    }
    
    onSetBrainKey(brnkey) {
        this.setState({brnkey})
    }
    
}

export var BrainkeyStoreWrapped = alt.createStore(BrainkeyStore)
export default BrainkeyStoreWrapped