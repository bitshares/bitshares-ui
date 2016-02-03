// Localstorage
var ls = typeof localStorage === "undefined" ? null : localStorage;

var STORAGE_KEY = null;

module.exports = (key) => {
    
    STORAGE_KEY = key;

    return {
        get(key) {
            if (ls) {
                return JSON.parse(ls.getItem(STORAGE_KEY + key));
            }
        },

        set(key, object) {
            if (object.toJS) {
                object = object.toJS();
            }
            if (ls) {
                ls.setItem(STORAGE_KEY + key, JSON.stringify(object));
            }
        }
    };
}