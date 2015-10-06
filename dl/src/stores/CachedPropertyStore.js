import alt from "alt-instance"
import Immutable from "immutable"
import iDB from "idb-instance"
import BaseStore from "stores/BaseStore"
import CachedPropertyActions from "actions/CachedPropertyActions"

class CachedPropertyStore extends BaseStore {
    
    constructor() {
        super()
        this.state = this._getInitialState()
        this.bindListeners({
            onSet: CachedPropertyActions.set,
            onGet: CachedPropertyActions.get
        })
        this._export("get", "reset")
    }

    _getInitialState() {
        return {
            props: Immutable.Map()
        }
    }
    
    get(name) {
        return this.onGet({ name })
    }
    
    onSet({ name, value }) {
        if(this.state.props.get(name) === value) return
        var props = this.state.props.set(name, value)
        this.state.props = props
        iDB.setCachedProperty(name, value).then(()=>
            this.setState({ props }))
    }
    
    onGet({ name }) {
        var value = this.state.props.get(name)
        console.log("name", name, value)
        if(value !== undefined) return value
        iDB.getCachedProperty(name).then( value => {
            var props = this.state.props.set(name, value)
            this.state.props = props
            this.setState({ props })
        })
    }
    
    reset() {
        console.log("reset");
        this.state = this._getInitialState()
        this.setState(this.state)
    }
}

export var CachedPropertyStoreWrapped = alt.createStore(CachedPropertyStore, "CachedPropertyStore")
export default CachedPropertyStoreWrapped