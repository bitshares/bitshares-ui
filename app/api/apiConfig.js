import {getFaucet, getTestFaucet} from "../branding";

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
    ESTIMATE_INPUT: "/estimate-input-amount",
    RPC_URL: "https://openledger.info/api/"
};

export const rudexAPIs = {
    BASE: "https://gateway.rudex.org/api/rudex",
    COINS_LIST: "/coins",
    NEW_DEPOSIT_ADDRESS: "/simple-api/initiate-trade"
};

export const bitsparkAPIs = {
    BASE: "https://dex-api.bitspark.io/api/v1",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs",
    DEPOSIT_LIMIT: "/deposit-limits",
    ESTIMATE_OUTPUT: "/estimate-output-amount",
    ESTIMATE_INPUT: "/estimate-input-amount"
};

export const cryptoBridgeAPIs = {
    BASE: "https://api.crypto-bridge.org/api/v1",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/wallets",
    MARKETS: "/markets",
    TRADING_PAIRS: "/trading-pairs"
};

export const citadelAPIs = {
    BASE: "https://citadel.li/trade",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs",
    DEPOSIT_LIMIT: "/deposit-limits",
    ESTIMATE_OUTPUT: "/estimate-output-amount",
    ESTIMATE_INPUT: "/estimate-input-amount"
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

export const xbtsxAPIs = {
    BASE: "https://apis.xbts.io/api/v1",
    COINS_LIST: "/coin"
};

export const nodeRegions = [
    // region of the node follows roughly https://en.wikipedia.org/wiki/Subregion#/media/File:United_Nations_geographical_subregions.png
    "Northern Europe",
    "Western Europe",
    "Southern Europe",
    "Eastern Europe",
    "Northern Asia",
    "Western Asia",
    "Southern Asia",
    "Eastern Asia",
    "Central Asia",
    "Southeastern Asia",
    "Australia and New Zealand",
    "Melanesia",
    "Polynesia",
    "Micronesia",
    "Northern Africa",
    "Western Africa",
    "Middle Africa",
    "Eastern Africa",
    "Southern Africa",
    "Northern America",
    "Central America",
    "Caribbean",
    "South America"
];

export const settingsAPIs = {
    // If you want a location to be translated, add the translation to settings in locale-xx.js
    // and use an object {translate: key} in WS_NODE_LIST
    DEFAULT_WS_NODE: "wss://fake.automatic-selection.com",
    WS_NODE_LIST: [
        {
            url: "wss://fake.automatic-selection.com",
            location: {translate: "settings.api_closest"}
        },
        {
            url: "ws://127.0.0.1:8090",
            location: "Locally hosted"
        },
        {
            url: "wss://dex.iobanker.com:9090",
            region: "Western Europe",
            country: "Germany",
            location: "Frankfurt",
            operator: "Witness: iobanker-core",
            contact: "email:admin@iobanker.com"
        },
        {
            url: "wss://bitshares.openledger.info/ws",
            location: "Nuremberg",
            region: "Western Europe",
            country: "Germany",
            operator: "Witness: openledger-dc",
            contact: "telegram:v1pby"
        },
        {
            url: "wss://openledger.hk/ws",
            region: "Southeastern Asia",
            country: "Singapore",
            operator: "Witness: openledger-dc",
            contact: "telegram:v1pby"
        },
        {
            url: "wss://bit.btsabc.org/ws",
            region: "Eastern Asia",
            country: "China",
            location: "Hong Kong",
            operator: "Witness: abc123",
            contact: "QQ:58291;email:58291@qq.com"
        },
        {
            url: "wss://ws.gdex.top",
            region: "Eastern Asia",
            country: "China",
            location: "Shanghai",
            operator: "Witness: gdex-witness",
            contact: "telegram:BrianZhang"
        },
        {
            url: "wss://api.weaccount.cn",
            region: "Eastern Asia",
            country: "China",
            location: "Hangzhou",
            operator: "Witness: btspp-witness",
            contact: "telegram:btsplusplus"
        },
        {
            url: "wss://dexnode.net/ws",
            region: "Northern America",
            country: "U.S.A.",
            location: "Dallas",
            operator: "Witness: Sahkan",
            contact: "telegram:Sahkan_bitshares"
        },
        {
            url: "wss://kc-us-dex.xeldal.com/ws", // check
            region: "Northern America",
            country: "U.S.A.",
            location: "Kansas City",
            operator: "Witness: xeldal",
            contact: "telegram:xeldal"
        },
        {
            url: "wss://api-ru.bts.blckchnd.com",
            region: "Eastern Europe",
            country: "Russia",
            location: "Moscow",
            operator: "Witness: blckchnd",
            contact:
                "email:admin@blckchnd.com;telegram:ruslansalikhov;github:blckchnd"
        },
        {
            url: "wss://blockzms.xyz/ws",
            region: "Northern America",
            country: "U.S.A.",
            location: "New Jersey",
            operator: "Witness: delegate-zhaomu",
            contact: "telegram:lzmlam;wechat:lzmlam"
        },
        {
            url: "wss://eu.nodes.bitshares.ws",
            region: "Western Europe",
            country: "Germany",
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "wss://us.nodes.bitshares.ws",
            region: "Northern America",
            country: "U.S.A.",
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "wss://hk.nodes.bitshares.ws",
            region: "Eastern Asia",
            country: "Hong Kong",
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "wss://api.bts.mobi/ws",
            region: "Northern America",
            country: "U.S.A.",
            location: "Virginia",
            operator: "Witness: in.abit",
            contact: "telegram:abitmore"
        },
        // {
        //     url: "wss://api.bts.network/", // check
        //     region: "Northern America",
        //     country: "U.S.A.",
        //     location: "Virginia",
        //     operator: "Witness: fox",
        //     contact: "telegram:ryanRfox"
        // },
        {
            url: "wss://btsws.roelandp.nl/ws",
            region: "Northern Europe",
            country: "Finland",
            location: "Helsinki",
            operator: "Witness: roelandp",
            contact: "telegram:roelandp"
        },
        {
            url: "wss://api.bitshares.bhuz.info/ws",
            region: "Northern America",
            country: "Canada",
            operator: "Witness: bhuz",
            contact: "telegram:bhuzor"
        },
        //{
        //    url: "wss://bts-api.lafona.net/ws",
        //    region: "Northern America",
        //    country: "Canada",
        //    location: "Montreal",
        //    operator: "Witness: delegate-1.lafona",
        //    contact: "telegram:lafona"
        //},
        {
            url: "wss://kimziv.com/ws",
            region: "Northern America",
            country: "U.S.A.",
            location: "New Jersey",
            operator: "Witness: witness.yao",
            contact: "telegram:imyao"
        },
        {
            url: "wss://api.btsgo.net/ws",
            region: "Southeastern Asia",
            location: "Singapore",
            operator: "Witness: xn-delegate",
            contact: "wechat:Necklace"
        },
        {
            url: "wss://bts.open.icowallet.net/ws",
            region: "Eastern Asia",
            country: "China",
            location: "Hangzhou",
            operator: "Witness: magicwallet.witness",
            contact: "telegram:plus_wave"
        },
        {
            url: "wss://freedom.bts123.cc:15138/",
            region: "Eastern Asia",
            country: "China",
            location: "Changsha",
            operator: "Witness: delegate.freedom",
            contact: "telegram:eggplant"
        },
        {
            url: "wss://bitshares.bts123.cc:15138/",
            region: "Eastern Asia",
            country: "China",
            location: "Hangzhou",
            operator: "Witness: delegate.freedom",
            contact: "telegram:eggplant"
        },
        {
            url: "wss://api.bts.ai",
            region: "Eastern Asia",
            country: "China",
            location: "Beijing",
            operator: "Witness: witness.hiblockchain",
            contact: "telegram:vianull;wechat:strugglingl"
        },
        {
            url: "wss://bts-seoul.clockwork.gr",
            region: "Southeastern Asia",
            country: "Korea",
            location: "Seoul",
            operator: "Witness: clockwork",
            contact: "telegram:clockworkgr"
        },
        {
            url: "wss://api.61bts.com",
            region: "Eastern Asia",
            country: "China",
            location: "Shandong",
            operator: "Witness: liuye",
            contact: "email:work@domyself.me"
        },
        {
            url: "wss://btsfullnode.bangzi.info/ws",
            region: "Western Europe",
            country: "Germany",
            location: "Munich",
            operator: "Witness: Bangzi",
            contact: "telegram:Bangzi"
        },
        {
            url: "wss://api.dex.trading/",
            region: "Western Europe",
            country: "France",
            location: "Paris",
            operator: "Witness: zapata42-witness",
            contact: "telegram:Zapata_42"
        },
        {
            url: "wss://citadel.li/node",
            region: "Western Europe",
            country: "Iceland",
            location: "Reykjavik",
            operator: "CITADEL",
            contact: "email:citadel.li;support"
        },

        // Testnet
        {
            url: "wss://node.testnet.bitshares.eu",
            region: "TESTNET - Western Europe",
            country: "Germany",
            location: "Frankfurt",
            operator: "BitShares Europe",
            contact: "telegram:xeroc"
        },
        {
            url: "wss://testnet.nodes.bitshares.ws",
            region: "TESTNET - Western Europe",
            country: "Germany",
            location: "Nuremberg",
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "wss://testnet.dex.trading/",
            region: "TESTNET - Western Europe",
            country: "France",
            location: "Paris",
            operator: "Witness: zapata42-witness",
            contact: "telegram:Zapata_42"
        },
        {
            url: "wss://api.gbacenter.org/ws",
            region: "Northern America",
            country: "U.S.A.",
            location: "Fremont, CA",
            operator: "Witness: gbac-ety001",
            contact: "email:work@domyself.me"
        }
    ],
    ES_WRAPPER_LIST: [
        {
            url: "https://eu.wrapper.elasticsearch.bitshares.ws",
            region: "Western Europe",
            country: "Germany",
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "https://us.wrapper.elasticsearch.bitshares.ws",
            region: "Northern America",
            country: "U.S.A.",
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "https://hk.wrapper.elasticsearch.bitshares.ws",
            region: "Hong Kong",
            country: "China",
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "https://explorer.bitshares-kibana.info",
            region: "N/A",
            country: "N/A",
            operator: "N/A",
            contact: "N/A"
        }
    ],
    DEFAULT_FAUCET: getFaucet().url,
    TESTNET_FAUCET: getTestFaucet().url
};
