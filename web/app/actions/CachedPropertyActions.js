import alt from "alt-instance";

class CachedPropertyActions {

    set(name, value) {
        return { name, value };
    }

    get(name) {
        return { name };
    }

    reset() {
        return true;
    }
}

var CachedPropertyActionsWrapped = alt.createActions(CachedPropertyActions);
export default CachedPropertyActionsWrapped;
