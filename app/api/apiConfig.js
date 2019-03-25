import {getFaucet} from "../branding";

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
    BASE: "https://gateway.rudex.org/api/v0_1",
    COINS_LIST: "/coins",
    NEW_DEPOSIT_ADDRESS: "/new-deposit-address"
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
    "Australia",
    "New Zealand",
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
            contact: "telegram:mtopenledger"
        },
        {
            url: "wss://openledger.hk/ws",
            region: "Southeastern Asia",
            country: "Singapore",
            operator: "Witness: openledger-dc",
            contact: "telegram:mtopenledger"
        },
        {
            url: "wss://na.openledger.info/ws",
            location: "Quebec",
            region: "Northern America",
            country: "Canada",
            operator: "Witness: openledger-dc",
            contact: "telegram:mtopenledger"
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
            url: "wss://bitshares.crypto.fans/ws",
            region: "Western Europe",
            country: "Germany",
            location: "Munich",
            operator: "Witness: sc-ol",
            contact: "telegram:startail"
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
            url: "wss://dex.rnglab.org",
            region: "Northern Europe",
            country: "Netherlands",
            location: "Amsterdam",
            operator: "Witness: rnglab",
            contact: "keybase:rnglab"
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
            url: "wss://kc-us-dex.xeldal.com/ws",
            region: "North America",
            country: "U.S.A.",
            location: "Kansas City",
            operator: "Witness: xeldal",
            contact: "telegram:xeldal"
        },
        {
            url: "wss://api.bts.blckchnd.com",
            region: "Western Europe",
            country: "Germany",
            location: "Falkenstein",
            operator: "Witness: blckchnd",
            contact:
                "email:admin@blckchnd.com;telegram:ruslansalikhov;github:blckchnd"
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
            url: "wss://api.bitsharesdex.com",
            region: "Northern America",
            country: "U.S.A.",
            location: "Kansas City",
            operator: "Witness: delegate.ihashfury",
            contact: "telegram:ihashfury"
        },
        {
            url: "wss://api.fr.bitsharesdex.com",
            region: "Western Europe",
            country: "France",
            location: "Paris",
            operator: "Witness: delegate.ihashfury",
            contact: "telegram:ihashfury"
        },
        {
            url: "wss://blockzms.xyz/ws ",
            region: "North America",
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
            region: "North America",
            country: "U.S.A.",
            operator: "Infrastructure Worker",
            contact: "email:info@blockchainprojectsbv.com"
        },
        {
            url: "wss://sg.nodes.bitshares.ws",
            region: "Southeastern Asia",
            country: "Singapore",
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
        {
            url: "wss://api.btsxchng.com",
            region: "Multiple",
            country: "Worldwide",
            location: "Singapore / N. Virginia / London",
            operator: "Witness: elmato",
            contact: "telegram:elmato"
        },
        {
            url: "wss://api.bts.network/",
            region: "North America",
            country: "U.S.A.",
            location: "Virginia",
            operator: "Witness: fox",
            contact: "telegram:ryanRfox"
        },
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
        {
            url: "wss://bts-api.lafona.net/ws",
            region: "Northern America",
            country: "Canada",
            location: "Montreal",
            operator: "Witness: delegate-1.lafona",
            contact: "telegram:lafona"
        },
        {
            url: "wss://kimziv.com/ws",
            region: "North America",
            country: "U.S.A.",
            location: "New Jersey",
            operator: "Witness: witness.yao",
            contact: "telegram:imyao"
        },
        {
            url: "wss://api.btsgo.net/ws",
            region: "Asia",
            location: "Singapore",
            operator: "Witness: xn-delegate",
            contact: "wechat:Necklace"
        },
        {
            url: "wss://bts.proxyhosts.info/wss",
            region: "Western Europe",
            country: "Germany",
            location: "",
            operator: "Witness: verbaltech2",
            contact: "keybase:jgaltman"
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
            url: "wss://crazybit.online",
            region: "Asia",
            country: "China",
            location: "Shenzhen",
            operator: "Witness: crazybit",
            contact: "telegram:crazybits;wechat:JamesCai"
        },
        {
            url: "wss://freedom.bts123.cc:15138/",
            region: "South China",
            country: "China",
            location: "Changsha",
            operator: "Witness: delegate.freedom",
            contact: "telegram:eggplant"
        },
        {
            url: "wss://bitshares.bts123.cc:15138/",
            region: "North China",
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
            url: "wss://ws.hellobts.com",
            region: "Eastern Asia",
            country: "Japan",
            location: "Tokyo",
            operator: "Witness: xman",
            contact: "wechat:hidpos;email:hellobts@qq.com"
        },
        {
            url: "wss://bitshares.cyberit.io",
            region: "Eastern Asia",
            country: "China",
            location: "Hong Kong",
            operator: "Witness: witness.still",
            contact: "telegram:gordoor;wechat:overyard"
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
            url: "wss://bts.liuye.tech:4443/ws",
            region: "Eastern Asia",
            country: "China",
            location: "Shandong",
            operator: "Witness: liuye",
            contact: "email:work@liuye.tech"
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
        {
            url: "wss://us-west-2.bts.crypto-bridge.org",
            region: "Northern America",
            country: "U.S.A.",
            location: "North California",
            operator: "CryptoBridge",
            contact: "email:support@crypto-bridge.org"
        },
        {
            url: "wss://eu-central-1.bts.crypto-bridge.org",
            region: "Western Europe",
            country: "Netherlands",
            location: "Amsterdam",
            operator: "CryptoBridge",
            contact: "email:support@crypto-bridge.org"
        },
        {
            url: "wss://ap-northeast-1.bts.crypto-bridge.org",
            region: "Southeastern Asia",
            country: "Japan",
            location: "Tokyo",
            operator: "CryptoBridge",
            contact: "email:support@crypto-bridge.org"
        },
        {
            url: "wss://ap-southeast-1.bts.crypto-bridge.org",
            region: "Southeastern Asia",
            country: "Singapore",
            location: "Singapore",
            operator: "CryptoBridge",
            contact: "email:support@crypto-bridge.org"
        },
        {
            url: "wss://ap-southeast-2.bts.crypto-bridge.org",
            region: "Australia",
            country: "Australia",
            location: "Sydney",
            operator: "CryptoBridge",
            contact: "email:support@crypto-bridge.org"
        },
        {
            url: "wss://ap-southeast-3.bts.crypto-bridge.org",
            region: "Southeastern Asia",
            country: "Singapore",
            location: "Singapore",
            operator: "CryptoBridge",
            contact: "email:support@crypto-bridge.org"
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
        }
    ],
    DEFAULT_FAUCET: getFaucet().url,
    TESTNET_FAUCET: "https://faucet.testnet.bitshares.eu"
};
