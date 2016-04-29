// Localstorage
import ls, {ls_key_exists} from './localStorageImpl';

if (null===ls) throw "localStorage is required but isn't available on this platform";

module.exports = (key) => {

    var STORAGE_KEY = key;

    return {
        get(key, dv = {}) {

            let rv;
            if ( ls_key_exists(STORAGE_KEY + key, ls) ) {
                rv = JSON.parse(ls.getItem(STORAGE_KEY + key));
            }
            return rv ? rv : dv;
        },

        set(key, object) {
            if (object.toJS) {
                object = object.toJS();
            }
            ls.setItem(STORAGE_KEY + key, JSON.stringify(object));
        },

        remove(key) {
            ls.removeItem(STORAGE_KEY + key);
        },

        has(key) {
            return ls_key_exists(STORAGE_KEY + key, ls);
        }
    };
}
