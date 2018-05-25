export const blockTradesAPIs = {
    BASE: "https://api.blocktrades.us/v2",
    // BASE_OL: "https://api.blocktrades.us/ol/v2",
    BASE_OL: "https://ol-api1.openledger.info/api/v0/ol/support",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs",
    DEPOSIT_LIMIT: "/deposit-limits",
    ESTIMATE_OUTPUT: "/estimate-output-amount"
};

export const rudexAPIs = {
    BASE: "https://gateway.rudex.org/api/v0_1",
    COINS_LIST: "/coins",
    NEW_DEPOSIT_ADDRESS: "/new-deposit-address"
};

export const settingsAPIs = {
    //    DEFAULT_WS_NODE: "wss://fake.automatic-selection.com",
    DEFAULT_WS_NODE: "ws://prod.totalpoker.io:8090",
    WS_NODE_LIST: [
        {url: "ws://prod.totalpoker.io:8090", location: "Playchain"},
        {url: "ws://stage.totalpoker.io:8090", location: "Playchain (testnet)"},
        {url: "ws://localhost:8090", location: "Locally hosted"}
    ],
    DEFAULT_FAUCET: "http://prod.totalpoker.io:3000",
    RPC_URL: "http://prod.totalpoker.io:3000/api/"
};
