export const blockTradesAPIs = {
    BASE: "https://api.blocktrades.us/v2",
    BASE_OL: "https://api.blocktrades.us/ol/v2",
    COINS_LIST: "/coins"
};

export const settingsAPIs = {
    DEFAULT_WS_NODE: "wss://bitshares.openledger.info/ws",
    WS_NODE_LIST: [
        {url: "wss://bitshares.openledger.info/ws", location: "Nuremberg, Germany"},
        {url: "wss://bit.btsabc.org/ws", location: "Hong Kong"},
        {url: "wss://bts.transwiser.com/ws", location: "Hangzhou, China"},
        {url: "wss://bitshares.dacplay.org:8089/ws", location:  "Hangzhou, China"},
        {url: "wss://openledger.hk/ws", location: "Hong Kong"},
        {url: "wss://secure.freedomledger.com/ws", location: "Toronto, Canada"},
        {url: "wss://testnet.bitshares.eu/ws", location: "Public Testnet Server (Frankfurt, Germany)"}
    ],
    DEFAULT_FAUCET: "https://bitshares.openledger.info",
    RPC_URL: "https://openledger.info/api/"
};
