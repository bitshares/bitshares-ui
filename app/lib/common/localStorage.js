import ls, {ls_key_exists} from "./localStorageImpl";

/**
 * Initialize localStorage. Default is to use persistant implementation
 */
class AbstractLocalStorage {
    constructor(prefix) {
        this._storage_prefix = prefix;
    }

    _translateKey(key) {
        return this._storage_prefix + key;
    }

    get(key, defaultValue = {}) {
        key = this._translateKey(key);
        try {
            if (this.has(key)) {
                var value = this._get(key);
                if (value === undefined || value === null) {
                    return defaultValue;
                } else {
                    return value;
                }
            } else {
                return defaultValue;
            }
        } catch (err) {
            return defaultValue;
        }
    }

    _get(key) {
        throw Error("Needs implementation");
    }

    set(key, object) {
        key = this._translateKey(key);
        if (object && object.toJS) {
            object = object.toJS();
        }
        this._set(key, JSON.stringify(object));
    }

    _set(key) {
        throw Error("Needs implementation");
    }

    remove(key) {
        key = this._translateKey(key);
        this._remove(key);
    }

    has(key) {
        key = this._translateKey(key);
        this._has(key);
    }

    _remove(key) {
        throw Error("Needs implementation");
    }

    _has(key) {
        throw Error("Needs implementation");
    }
}

class PersistantLocalStorage extends AbstractLocalStorage {
    _get(key) {
        return JSON.parse(ls.getItem(key));
    }

    _set(key, object) {
        ls.setItem(key, JSON.stringify(object));
    }

    _remove(key) {
        ls.removeItem(key);
    }

    _has(key) {
        return ls_key_exists(key, ls);
    }
}

class InRamLocalStorage extends AbstractLocalStorage {
    constructor(prefix) {
        super(prefix);
        this._dict = {};
    }

    _get(key) {
        return this._dict.get(key);
    }

    _set(key, object) {
        // keep the stringify, to be consistent across storage impls
        this._dict[key] = JSON.stringify(object);
    }

    _remove(key) {
        delete this._dict[key];
    }

    _has(key) {
        return key in this._dict;
    }
}

class DynamicLocalStorage extends AbstractLocalStorage {
    constructor(prefix) {
        super(prefix);

        // default is persistant storage, but if that is not available use inram
        this.useInRam();
        console.log("Using ", this._impl);
    }

    _get(key) {
        return this._impl._get(key);
    }

    _set(key, object) {
        this._impl._set(key, object);
    }

    _remove(key) {
        this._impl._remove(key);
    }

    _has(key) {
        return this._impl._has(key);
    }

    useInRam() {
        this._impl = new InRamLocalStorage(this._storage_prefix);
    }

    usePersistant() {
        this._impl = new PersistantLocalStorage(this._storage_prefix);
    }
}

/**
 * LocalStorage should be a singleton, wrap it
 * @param key
 * @returns {DynamicLocalStorage}
 */
const _localStorageCache = {};
const localStorage = prefix => {
    if (!(prefix in _localStorageCache)) {
        _localStorageCache[prefix] = new DynamicLocalStorage(prefix);
    }
    return _localStorageCache[prefix];
};
export default localStorage;
