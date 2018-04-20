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

export const cryptoBridgeAPIs = {
    BASE: "https://api.crypto-bridge.org/api/v1",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/wallets",
    MARKETS: "/markets",
    TRADING_PAIRS: "/trading-pairs"
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

export const settingsAPIs = {
    DEFAULT_WS_NODE: "wss://fake.automatic-selection.com",
    WS_NODE_LIST: [
        {
            url: "wss://fake.automatic-selection.com",
            location: {translate: "settings.api_closest"}
        },
        {url: "ws://127.0.0.1:8090", location: "Locally hosted"},
        {
            url: "wss://bitshares.openledger.info/ws",
            location: "Nuremberg, Germany"
        },
        {url: "wss://eu.openledger.info/ws", location: "Berlin, Germany"},
        {url: "wss://bitshares.nu/ws", location: "Stockholm, Sweden"},
        {url: "wss://bit.btsabc.org/ws", location: "Hong Kong"},
        {url: "wss://node.btscharts.com/ws", location: "Hong Kong"},
        {url: "wss://bitshares.apasia.tech/ws", location: "Bangkok, Thailand"},
        {url: "wss://japan.bitshares.apasia.tech/ws", location: "Tokyo, Japan"},
        {url: "wss://bitshares.dacplay.org/ws", location: "Hangzhou, China"},
        {url: "wss://bitshares-api.wancloud.io/ws", location: "China"},
        {url: "wss://openledger.hk/ws", location: "Hong Kong"},
        {url: "wss://bitshares.crypto.fans/ws", location: "Munich, Germany"},
        {url: "wss://ws.gdex.io", location: "Japan"},
        {url: "wss://ws.gdex.top", location: "China"},
        {url: "wss://dex.rnglab.org", location: "Netherlands"},
        {url: "wss://dexnode.net/ws", location: "Dallas, USA"},
        {url: "wss://la.dexnode.net/ws", location: "LA, USA"},
        {url: "wss://kc-us-dex.xeldal.com/ws", location: "Kansas City, USA"},
        {url: "wss://btsza.co.za:8091/ws", location: "Cape Town, South Africa"},
        {url: "wss://api.bts.blckchnd.com", location: "Falkenstein, Germany"},
        {url: "wss://api-ru.bts.blckchnd.com", location: "Moscow, Russia"},
        {url: "wss://node.market.rudex.org", location: "Germany"},
        {
            url: "wss://eu.nodes.bitshares.ws",
            location: "Central Europe - BitShares Infrastructure Program"
        },
        {
            url: "wss://us.nodes.bitshares.ws",
            location: "U.S. West Coast - BitShares Infrastructure Program"
        },
        {
            url: "wss://sg.nodes.bitshares.ws",
            location: "Singapore - BitShares Infrastructure Program"
        },
        {url: "wss://ws.winex.pro", location: "Singapore"},
        {url: "wss://api.bts.mobi/ws", location: "VA, USA"},
        {
            url: "wss://api.btsxchng.com", 
            location: "Global (Asia Pacific (Singapore) / US East (N. Virginia) / EU (London))"
        },
        {url: "wss://api.bts.network", location: "East Coast, USA"},
        {url: "wss://btsws.roelandp.nl/ws", location: "Finland"},
        {url: "wss://api.bitshares.bhuz.info/ws", location: "Europe"},
        {url: "wss://bts-api.lafona.net/ws", location: "USA"},
        {url: "wss://kimziv.com/ws", location: "Singapore"},
        {url: "wss://api.btsgo.net/ws", location: "Singapore"},
        {url: "wss://bts.proxyhosts.info/wss", location: "Germany"},
        {url: "wss://bts.open.icowallet.net/ws", location: "Hangzhou, China"},
        {url: "wss://blockzms.xyz/ws", location: "USA"},
        {url: "wss://crazybit.online", location: "China"},
        {url: "wss://freedom.bts123.cc:15138/", location: "China"},
        {url: "wss://bitshares.bts123.cc:15138/", location: "China"},
        {url: "wss://api.bts.ai/", location: "Beijing, China"},
        {url: "wss://ws.hellobts.com/", location: "Japan"},
        {url: "wss://bitshares.cyberit.io/", location: "Hong Kong"},
        {url: "wss://bts-seoul.clockwork.gr/", location: "Seoul, Korea"},
        {url: "wss://bts.to0l.cn:4443/ws", location: "China"},
        // Testnet
        {
            url: "wss://node.testnet.bitshares.eu",
            location: "TESTNET - BitShares Europe (Frankfurt, Germany)"
        },
        {
            url: "wss://testnet.nodes.bitshares.ws",
            location: "TESTNET - BitShares Infrastructure Program"
        }
    ],
    DEFAULT_FAUCET: "https://faucet.bitshares.eu/onboarding", // 2017-12-infrastructure worker proposal
    TESTNET_FAUCET: "https://faucet.testnet.bitshares.eu",
    RPC_URL: "https://openledger.info/api/"
};

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
