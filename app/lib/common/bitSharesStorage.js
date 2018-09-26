import localStorage from "./localStorage";
let bitSharesStorage = key => {
    // Return Component if no localStorage is available
    let bs = new localStorage(key);
    const persist = false;
    if (persist) {
        bs.set = value => {
            return value;
        };
    }
    return bs;
};

export default bitSharesStorage;
