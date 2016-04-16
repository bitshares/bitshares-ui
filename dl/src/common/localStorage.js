// Localstorage
var ls = typeof localStorage === "undefined" ? null : localStorage;

var STORAGE_KEY = null;

module.exports = (key) => {
    
    STORAGE_KEY = key;

    return {
        get(key, dv = {}) {
            let rv;
            if (ls && (STORAGE_KEY + key) in ls) {
                rv = JSON.parse(ls.getItem(STORAGE_KEY + key));
            }
            return rv ? rv : dv;
        },

        set(key, object) {
            if (object.toJS) {
                object = object.toJS();
            }
            if (ls) {
                ls.setItem(STORAGE_KEY + key, JSON.stringify(object));
            }
        },

        remove(key) {
            if (ls) {
                ls.removeItem(STORAGE_KEY + key);
            }
        },

        has(key) {
            if (!ls) {
                return false;
            }

            return key in ls;
        }


    };
}