import {getFaucet, getTestFaucet} from "../branding";

export const ioxbankAPIs = {
    BASE: "https://api.ioxbank.com/bitshares",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs",
    NEW_DEPOSIT_ADDRESS: "/simple-api/initiate-trade"
};

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
    BASE: "https://api.52bts.net/adjust",
    COINS_LIST: "/coins",
    ACTIVE_WALLETS: "/active-wallets",
    TRADING_PAIRS: "/trading-pairs"
};

// Legacy Deposit/Withdraw
export const gdexAPIs = {
    BASE: "https://api.52bts.net",
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
    BASE: "https://apis.xbts.io/api/v2",
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
            url: "wss://nexus01.co.uk/ws",
            region: "Northern Europe",
            country: "England",
            location: "Gloucester",
            operator: "Witness: nexus01",
            contact: "telegram:rosswlkr"
        },
        {
            url: "wss://dex.iobanker.com/ws",
            region: "Western Europe",
            country: "Germany",
            location: "Frankfurt",
            operator: "Witness: iobanker-core",
            contact: "email:admin@iobanker.com"
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
            url: "wss://api.bts.btspp.io:10100",
            region: "Eastern Asia",
            country: "China",
            location: "Hangzhou",
            operator: "Witness: btspp-witness",
            contact: "telegram:btsplusplus"
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
        // TODO the owner said it's temporarily closed. Recheck later.
        //{
        //    url: "wss://api.bts.ai",
        //    region: "Eastern Asia",
        //    country: "China",
        //    location: "Beijing",
        //    operator: "Witness: witness.hiblockchain",
        //    contact: "telegram:vianull;wechat:strugglingl"
        //},
        {
            url: "wss://api.61bts.com",
            region: "Eastern Asia",
            country: "China",
            location: "Shandong",
            operator: "Witness: liuye",
            contact: "email:work@akawa.ink"
        },
        {
            url: "wss://api-us.61bts.com",
            region: "Northern America",
            country: "USA",
            location: "St. Louis",
            operator: "Witness: liuye",
            contact: "email:work@akawa.ink"
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
            url: "wss://api.bitshares.org/ws",
            region: "Western Europe",
            country: "France",
            location: "",
            operator: "bitshares.org",
            contact: ""
        },
        {
            url: "wss://us.api.bitshares.org/ws",
            region: "Western Europe",
            country: "France",
            location: "",
            operator: "bitshares.org",
            contact: ""
        },
        {
            url: "wss://asia.api.bitshares.org/ws",
            region: "Western Europe",
            country: "France",
            location: "",
            operator: "bitshares.org",
            contact: ""
        },
        {
            url: "wss://eu.nodes.bitshares.ws",
            region: "Western Europe",
            country: "Germany",
            location: "Nuremberg",
            operator: "Witness: blocksights",
            contact: "telegram:blocksights"
        },
        {
            url: "wss://api-bts.liondani.com/ws",
            region: "Western Europe",
            country: "Germany",
            location: "Falkenstein",
            operator: "Witness: liondani",
            contact: "telegram:liondani"
        },
        {
            url: "wss://public.xbts.io/ws",
            region: "Western Europe",
            country: "Germany",
            location: "Nuremberg",
            operator: "Witness: xbtsio-wallet",
            contact: "telegram: xbtsio"
        },
        {
            url: "wss://cloud.xbts.io/ws",
            region: "Northern America",
            country: "U.S.A.",
            location: "VG, Ashburn",
            operator: "Witness: xbtsio-wallet",
            contact: "telegram: xbtsio"
        },
        {
            url: "wss://node.xbts.io/ws",
            region: "Western Europe",
            country: "Germany",
            location: "Falkenstein",
            operator: "Witness: xbtsio-wallet",
            contact: "telegram: xbtsio"
        },
        {
            url: "wss://bts.mypi.win",
            region: "Northern America",
            country: "U.S.A.",
            location: "Seattle, CA",
            operator: "Witness: gbac-ety001",
            contact: "email:work@akawa.ink"
        },
        {
            url: "wss://hongkong.bitshares.im/ws",
            region: "East Asia",
            country: "China",
            location: "Hong Kong",
            operator: "Witness: clone",
            contact: "telegram: yexiao"
        },
        {
            url: "wss://singapore.bitshares.im/ws",
            region: "Southeast Asia",
            country: "Singapore",
            location: "Singapore",
            operator: "Witness: clone",
            contact: "telegram: yexiao"
        },
        {
            url: "wss://newyork.bitshares.im/ws",
            region: "Northern America",
            country: "U.S.A.",
            location: "New York",
            operator: "Witness: clone",
            contact: "telegram: yexiao"
        },
        {
            url: "wss://api.btslebin.com/ws",
            region: "Eastern Asia",
            country: "China",
            location: "Hong Kong",
            operator: "Witness: lebin-witness",
            contact: "telegram: lebinbit"
        },
        // Testnet
        {
            url: "wss://eu.nodes.testnet.bitshares.ws",
            region: "TESTNET - Western Europe",
            country: "Germany",
            location: "Nuremberg",
            operator: "Witness: blocksights",
            contact: "telegram:blocksights"
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
            url: "wss://testnet.xbts.io/ws",
            region: "TESTNET - Europe",
            country: "Germany",
            location: "Nuremberg",
            operator: "Witness: xbtsio-wallet",
            contact: "telegram: xbtsio"
        },
        {
            url: "wss://testnet.bitshares.im/ws",
            region: "Eastern Asia",
            country: "Japan",
            location: "Tokyo",
            operator: "Witness: clone",
            contact: "telegram: yexiao"
        },
        {
            url: "wss://api-testnet.61bts.com/ws",
            region: "Eastern Asia",
            country: "China",
            location: "Shandong",
            operator: "Witness: liuye",
            contact: "email:work@akawa.ink"
        },
        {
            url: "wss://api-us-testnet.61bts.com/ws",
            region: "Northern America",
            country: "USA",
            location: "St. Louis",
            operator: "Witness: liuye",
            contact: "email:work@akawa.ink"
        },
        {
            url: "wss://api.bitshares.info",
            region: "North America",
            country: "United States",
            location: "Chicago",
            operator: "bitshares.info",
            contact: "telegram:brekyrself"
        },
    ],
    ES_WRAPPER_LIST: [
        {
            url: "https://api.bitshares.ws/openexplorer",
            region: "Western Europe",
            country: "Germany",
            operator: "blocksights.info",
            contact: "telegram:blocksights"
        }
    ],
    DEFAULT_FAUCET: getFaucet().url,
    TESTNET_FAUCET: getTestFaucet().url
};
