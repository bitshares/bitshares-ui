import ls, {ls_key_exists} from "./localStorageImpl";

/**
 * Abstract interface for local storage. Provides get, set, has and remove. Actual implementation must override
 * _get, _set, _has and _remove.
 *
 * @author Stefan Schießl, Alexander Verevkin
 */
class AbstractLocalStorage {
    constructor(prefix) {
        this._storage_prefix = prefix;
    }

    /**
     * Add the prefix for the key
     *
     * @param key
     * @returns {*}
     * @private
     */
    _translateKey(key) {
        return this._storage_prefix + key;
    }

    /**
     * Checks if the underlying storage has the key, and if so and it has a valid value, returns it.
     * Otherwise default value is returned.
     *
     * @param key
     * @param defaultValue
     * @returns {*}
     */
    get(key, defaultValue = {}) {
        try {
            if (this.has(key)) {
                key = this._translateKey(key);
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

    /**
     * Internal getter to access the actual implementation, only for derived classes
     *
     * @param key
     * @private
     */
    _get(key) {
        throw Error("Needs implementation");
    }

    /**
     * Stringifies the given value and stores it associated to the given key
     *
     * @param key
     * @param object
     */
    set(key, object) {
        this._set(this._translateKey(key), object);
    }

    /**
     * Internal setter to access the actual implementation, only for derived classes
     *
     * @param key
     * @private
     */
    _set(key) {
        throw Error("Needs implementation");
    }

    /**
     * Removes the key from the storage
     *
     * @param key
     */
    remove(key) {
        this._remove(this._translateKey(key));
    }

    /**
     * Check if the key is present in the storage
     * @param key
     */
    has(key) {
        return this._has(this._translateKey(key));
    }

    /**
     * Internal remove to access the actual implementation, only for derived classes
     *
     * @param key
     * @private
     */
    _remove(key) {
        throw Error("Needs implementation");
    }

    /**
     * Internal has  to access the actual implementation, only for derived classes
     *
     * @param key
     * @private
     */
    _has(key) {
        throw Error("Needs implementation");
    }
}

/**
 * Persistant storage that access the typically known as localStorage implementation of modern browsers
 */
class PersistantLocalStorage extends AbstractLocalStorage {
    _get(key) {
        let value = ls.getItem(key);
        if (value === "") {
            return value;
        } else {
            return JSON.parse(value);
        }
    }

    _set(key, object) {
        if (object === "") {
            ls.setItem(key, object);
        } else {
            ls.setItem(key, JSON.stringify(object));
        }
    }

    _remove(key) {
        ls.removeItem(key);
    }

    _has(key) {
        return ls_key_exists(key, ls);
    }

    _getLocalStorage() {
        return ls;
    }
}

/**
 * Storage that keeps everything in a local variable that is only kept in ram
 */
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

var enforceLocalStorageType = null;

/**
 * Allow the wallet to switch the storage type (e.g. for private sessions)
 * @param type
 */
export const setLocalStorageType = type => {
    if (type !== "inram" && type !== "persistant") {
        throw "Please choose inram or persistant storage type";
    }
    enforceLocalStorageType = type;
};

export const isPersistantType = () => {
    return (
        enforceLocalStorageType == null ||
        enforceLocalStorageType == "persistant"
    );
};

/**
 * Storage that allows switching between persistant and inram implementation
 */
class DynamicLocalStorage extends AbstractLocalStorage {
    constructor(prefix) {
        super(prefix);

        // default is persistant storage, but if that is not available use inram
        if (null === ls) {
            this.useInRam();
        } else {
            this.usePersistant();
        }
    }

    isPersistant() {
        return this._impl instanceof PersistantLocalStorage;
    }

    _switchIfNecessary() {
        if (enforceLocalStorageType == null) {
            return;
        }
        if (enforceLocalStorageType == "inram") {
            this.useInRam();
        } else {
            this.usePersistant();
        }
    }

    _get(key) {
        this._switchIfNecessary();
        return this._impl._get(key);
    }

    _set(key, object) {
        this._switchIfNecessary();
        this._impl._set(key, object);
    }

    _remove(key) {
        this._switchIfNecessary();
        this._impl._remove(key);
    }

    _has(key) {
        this._switchIfNecessary();
        return this._impl._has(key);
    }

    /**
     * When switching from persistant to inram, copy persistant as default
     */
    useInRam() {
        let copy = {};
        if (this.isPersistant()) {
            console.log("Switching to InRam storage for private session");
            for (
                var i = 0, len = this._impl._getLocalStorage().length;
                i < len;
                ++i
            ) {
                let key = this._impl._getLocalStorage().key(i);
                copy[key] = this._impl._getLocalStorage().getItem(key);
            }
        }
        this._impl = new InRamLocalStorage(this._storage_prefix);
        for (let key in copy) {
            this._impl._set(key, copy[key]);
        }
    }

    usePersistant() {
        this._impl = new PersistantLocalStorage(this._storage_prefix);
    }
}

// LocalStorage should be a singleton, wrap it
const _localStorageCache = {};
const localStorage = prefix => {
    if (!(prefix in _localStorageCache)) {
        _localStorageCache[prefix] = new DynamicLocalStorage(prefix);
    }
    return _localStorageCache[prefix];
};
export default localStorage;
