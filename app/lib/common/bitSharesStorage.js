import localStorage from "./localStorage";

class bitSharesStorage extends localStorage {
    constructor(key, persist) {
        super(key);
        this.originset = this.set;
        this.set = this._set;
        this.persist = persist;
    }

    _set = value => {
        if (this.persist) {
            return value;
        } else {
            return this.originset(value);
        }
    };
}

export default bitSharesStorage;
