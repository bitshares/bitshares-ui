const CB_API_BASE =
    __DEVNET_API__ ||
    "https://api." + (__TESTNET__ ? "testnet." : "") + "crypto-bridge.org";
const CB_FAUCET = CB_API_BASE;

export const blockTradesAPIs = {
    BASE: "https://api.blocktrades.us/v2",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs",
    DEPOSIT_LIMIT: "/deposit-limits",
    ESTIMATE_OUTPUT: "/estimate-output-amount",
    ESTIMATE_INPUT: "/estimate-input-amount"
};

export const openledgerAPIs = {
    BASE: "https://ol-api1.openledger.info/api/v0/ol/support",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs",
    DEPOSIT_LIMIT: "/deposit-limits",
    ESTIMATE_OUTPUT: "/estimate-output-amount",
    ESTIMATE_INPUT: "/estimate-input-amount"
};

export const rudexAPIs = {
    BASE: "https://gateway.rudex.org/api/v0_1",
    COINS_LIST: "/coins",
    NEW_DEPOSIT_ADDRESS: "/new-deposit-address"
};

export const widechainAPIs = {
    BASE: "https://gateway.winex.pro/api/v0/ol/support",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    NEW_DEPOSIT_ADDRESS: "/new-deposit-address",
    WITHDRAW_HISTORY: "/latelyWithdraw",
    TRADING_PAIRS: "/trading-pairs",
    DEPOSIT_HISTORY: "/latelyRecharge"
};

export const gdex2APIs = {
    BASE: "https://api.gdex.io/adjust",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs"
};

// Legacy Deposit/Withdraw
export const gdexAPIs = {
    BASE: "https://api.gdex.io",
    ASSET_LIST: "/gateway/asset/assetList",
    ASSET_DETAIL: "/gateway/asset/assetDetail",
    GET_DEPOSIT_ADDRESS: "/gateway/address/getAddress",
    CHECK_WITHDRAY_ADDRESS: "/gateway/address/checkAddress",
    DEPOSIT_RECORD_LIST: "/gateway/deposit/recordList",
    DEPOSIT_RECORD_DETAIL: "/gateway/deposit/recordDetail",
    WITHDRAW_RECORD_LIST: "/gateway/withdraw/recordList",
    WITHDRAW_RECORD_DETAIL: "/gateway/withdraw/recordDetail",
    GET_USER_INFO: "/gateway/user/getUserInfo",
    USER_AGREEMENT: "/gateway/user/isAgree",
    WITHDRAW_RULE: "/gateway/withdraw/rule"
};

export const cryptoBridgeAPIs = {
    BASE: CB_API_BASE + "/api/v1",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/wallets",
    MARKETS: "/markets",
    TRADING_PAIRS: "/trading-pairs"
};

const WSS_DEV_NODES = [
    {
        url: "wss://fake.automatic-selection.com",
        location: {translate: "settings.api_closest"}
    },
    {
        url: "wss://bitshares.testnet.crypto-bridge.org",
        location: "DEVNET - CryptoBridge"
    }
];

const WSS_TEST_NODES = [
    {
        url: "wss://fake.automatic-selection.com",
        location: {translate: "settings.api_closest"}
    },
    {
        url: "ws://dev1.gpi.li:8090",
        location: "TESTNET - CryptoBridge"
    }
];

const WSS_PROD_NODES = [
    {
        url: "wss://fake.automatic-selection.com",
        location: {translate: "settings.api_closest"}
    },

    /* ASIA */

    // {url: "wss://singapore.bitshares.apasia.tech/ws", location: "Singapore, SG"},
    {url: "wss://japan.bitshares.apasia.tech/ws", location: "Tokyo, Japan"},
    // {url: "wss://seoul9.daostreet.com/ws", location: "Seoul, South Korea"}, // 502

    // {url: "wss://bit.btsabc.org/ws", location: "Hong Kong"},
    {url: "wss://openledger.hk/ws", location: "Hong Kong"},
    // {url: "wss://bts.transwiser.com/ws", location: "Hangzhou, China"}, // UNREACHABLE
    {url: "wss://bitshares.dacplay.org:8089/ws", location: "Hangzhou, China"},

    {
        url: "wss://ap-northeast-1.bts.crypto-bridge.org",
        location: "Tokyo, Japan"
    },
    {
        url: "wss://ap-northeast-2.bts.crypto-bridge.org",
        location: "Seoul, South Korea"
    },
    {
        url: "wss://ap-southeast-1.bts.crypto-bridge.org",
        location: "Singapore, SP"
    },

    /* USA WEST */

    // {url: "wss://oregon2.daostreet.com/ws", location: "Oregon, USA"}, // 502
    // {url: "wss://us-la.bitshares.apasia.tech/ws", location: "Los Angeles, USA"}, // 502
    // {url: "wss://scali10.daostreet.com/ws", location: "Los Angeles, USA"}, // 502
    // {url: "wss://ncali5.daostreet.com/ws", location: "San Francisco, USA"}, // 502
    // {url: "wss://valley.bitshares.apasia.tech/ws", location: "Silicon Valley, USA"}, // 502
    // {url: "wss://seattle.bitshares.apasia.tech/ws", location: "Seattle, USA"}, // 502

    {
        url: "wss://us-west-1.bts.crypto-bridge.org",
        location: "North California, USA"
    },

    /* USA EAST */

    // {url: "wss://new-york.bitshares.apasia.tech/ws", location: "New York, USA"}, // 502
    // {url: "wss://miami.bitshares.apasia.tech/ws", location: "Miami, USA"}, // 502
    // {url: "wss://atlanta.bitshares.apasia.tech/ws", location: "Atlanta, USA"},
    {url: "wss://chicago.bitshares.apasia.tech/ws", location: "Chicago, USA"},
    // {url: "wss://dallas.bitshares.apasia.tech/ws", location: "Dallas, USA"},
    // {url: "wss://ohio4.daostreet.com/ws", location: "Ohio, USA"},
    // {url: "wss://virginia3.daostreet.com/ws", location: "Virginia, USA"}, // 502

    {
        url: "wss://us-east-1.bts.crypto-bridge.org",
        location: "North Virginia, USA"
    },

    /* EUROPE */

    // {url: "wss://slovenia.bitshares.apasia.tech/ws", location: "Ljubljana, Slovenia"},
    {url: "wss://bitshares.nu/ws", location: "Stockholm, Sweden"},
    // {url: "wss://croatia.bitshares.apasia.tech/ws", location: "Zagreb, Croatia"}, // ERR_CONNECTION_REFUSED
    {
        url: "wss://england.bitshares.apasia.tech/ws",
        location: "London, England"
    },
    // {url: "wss://frankfurt8.daostreet.com/ws", location: "Frankfurt, Germany"}, // 502
    // {url: "wss://paris7.daostreet.com/ws", location: "Paris, France"}, // 502
    // {url: "wss://france.bitshares.apasia.tech/ws", location: "Paris, France"}, // 502

    // {url: "wss://bitshares.openledger.info/ws", location: "Nuremberg, Germany"},
    {url: "wss://eu.openledger.info/ws", location: "Berlin, Germany"},
    {url: "wss://api-ru.bts.blckchnd.com", location: "Moscow, Russia"},

    // {url: "wss://eu-west-1.bts.crypto-bridge.org", location:  "Ireland"},
    {
        url: "wss://eu-central-1.bts.crypto-bridge.org",
        location: "Frankfurt, Germany"
    },
    // {url: "wss://eu-west-2.bts.crypto-bridge.org/", location: "London, United Kingdom"},
    {url: "wss://eu-west-3.bts.crypto-bridge.org/", location: "Paris, France"},

    /* OTHER */

    // {url: "wss://australia.bitshares.apasia.tech/ws", location: "Sydney, Australia"}, // 502
    // {url: "wss://canada6.daostreet.com/ws", location: "Montréal, Canada"},
    // {url: "wss://capetown.bitshares.africa/ws", location: "Cape Town, Africa"}, // ERR_CONNECTION_REFUSED
    // {url: "wss://za.bitshares.africa/ws", location: "Cape Town, Africa"}, // ERR_CONNECTION_REFUSED

    // {url: "wss://secure.freedomledger.com/ws", location: "Toronto, Canada"},

    // {url: "wss://sa-east-1.bts.crypto-bridge.org", location: "Sao Paulo, Brazil"}, // DNS_PROBE_FINISHED_NXDOMAIN
    {
        url: "wss://ap-southeast-2.bts.crypto-bridge.org",
        location: "Sydney, Australia"
    }
    // {url: "wss://ap-south-1.bts.crypto-bridge.org", location: "Mumbai, India"}, // DNS_PROBE_FINISHED_NXDOMAIN
    // {url: "wss://ca-central-1.bts.crypto-bridge.org", location: "Montreal, Canada"},
];

export const settingsAPIs = {
    DEFAULT_WS_NODE: "wss://fake.automatic-selection.com",
    WS_NODE_LIST: __DEVNET__
        ? WSS_DEV_NODES
        : __TESTNET__
            ? WSS_TEST_NODES
            : WSS_PROD_NODES,
    DEFAULT_FAUCET: CB_FAUCET,
    TESTNET_FAUCET: CB_FAUCET,
    RPC_URL: "https://openledger.info/api/"
};
