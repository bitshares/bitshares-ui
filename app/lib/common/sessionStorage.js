// SessionStorage
import ss, {ss_key_exists} from "./sessionStorageImpl";

if (null===ss) throw "sessionStorage is required but isn't available on this platform";

const sessionStorage = (key) => {

    var STORAGE_KEY = key;

    return {
        get(key, dv = {}) {

            let rv;
            try {
                if ( ss_key_exists(STORAGE_KEY + key, ss) ) {
                    rv = JSON.parse(ss.getItem(STORAGE_KEY + key));
                }
                return rv ? rv : dv;
            } catch(err) {
                return dv;
            }
        },

        set(key, object) {
            if (object && object.toJS) {
                object = object.toJS();
            }
            ss.setItem(STORAGE_KEY + key, JSON.stringify(object));
        },

        remove(key) {
            ss.removeItem(STORAGE_KEY + key);
        },

        has(key) {
            return ss_key_exists(STORAGE_KEY + key, ss);
        }
    };
};

export default sessionStorage;
