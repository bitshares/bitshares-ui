import alt from "alt-instance"

class CachedPropertyActions {
    
    set(name, value) {
        this.dispatch({ name, value })
    }
    
    get(name) {
        this.dispatch({ name })
    }
    
    reset() {
        this.dispatch()
    }
    
}

var CachedPropertyActionsWrapped = alt.createActions(CachedPropertyActions)
export default CachedPropertyActionsWrapped