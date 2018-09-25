import ls from "./localStorage";
let bitSharesStorage = Storage => {
    // Return Storage if no localStorage is available
    if (!ls) return Storage;

    const STORAGE_KEY = "__graphene__";
    let ss = new ls(STORAGE_KEY);
    if (Storage.persist("true")) {
        ss.set = null;
    }

    class BitSharesStorage extends Storage {
        constructor() {
            super(ss);
        }
    }

    return BitSharesStorage;
};

export default bitSharesStorage;
