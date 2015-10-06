import alt from "alt-instance"
import Immutable from "immutable"
import iDB from "idb-instance"
import CachedPropertyActions from "actions/CachedPropertyActions"

class CachedPropertyStore {
    
    constructor() {
        // super()
        this.state = this._getInitialState()
        this.bindListeners({
            onSet: CachedPropertyActions.set,
            onGet: CachedPropertyActions.get
        })
    }

    _getInitialState() {
        return {
            props: Immutable.Map()
        }
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
        if(value !== undefined) return
        iDB.getCachedProperty(name).then( value => {
            var props = this.state.props.set(name, value)
            this.state.props = props
            this.setState({ props })
        })
    }
}

export var CachedPropertyStoreWrapped = alt.createStore(CachedPropertyStore, "CachedPropertyStore")
export default CachedPropertyStoreWrapped