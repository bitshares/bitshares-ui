import {Apis} from "bitsharesjs-ws";
/** This file centralized customization and branding efforts throughout the whole wallet and is meant to facilitate
 *  the process.
 *
 *  @author Stefan Schiessl <stefan.schiessl@blockchainprojectsbv.com>
 */

/**
 * Determine if we are running on testnet or mainnet
 * @private
 */
function _isTestnet() {
    const testnet =
        "39f5e2ede1f8bc1a3a54a7914414e3779e33193f1f5693510e73cb7a87617447"; // just for the record
    const mainnet =
        "4018d7844c78f6a6c41c6a552b898022310fc5dec06da467ee7905a8dad512c8";

    // treat every other chain as testnet
    return Apis.instance().chain_id !== mainnet;
}

/**
 * Wallet name that is used throughout the UI and also in translations
 * @returns {string}
 */
export function getWalletName() {
    return "BitShares";
}

/**
 * URL of this wallet
 * @returns {string}
 */
export function getWalletURL() {
    return "https://wallet.bitshares.org";
}

/**
 * Returns faucet information
 *
 * @returns {{url: string, show: boolean}}
 */
export function getFaucet() {
    return {
        url: "https://faucet.bitshares.eu/onboarding", // 2017-12-infrastructure worker proposal
        show: true,
        editable: false,
        referrer: "onboarding.bitshares.foundation"
    };
}

export function getTestFaucet() {
    // fixme should be solved by introducing _isTestnet into getFaucet and fixing the mess in the Settings when fetching faucet address
    return {
        url: "https://faucet.testnet.bitshares.eu", // operated as a contribution by BitShares EU
        show: true,
        editable: false
    };
}

/**
 * Logo that is used throughout the UI
 * @returns {*}
 */
export function getLogo() {
    return require("assets/logo-ico-blue.png");
}

/**
 * Default set theme for the UI
 * @returns {string}
 */
export function getDefaultTheme() {
    // possible ["darkTheme", "lightTheme", "midnightTheme"]
    return "darkTheme";
}

/**
 * Default login method. Either "password" (for cloud login mode) or "wallet" (for local wallet mode)
 * @returns {string}
 */
export function getDefaultLogin() {
    // possible: one of "password", "wallet"
    return "password";
}

/**
 * Default units used by the UI
 *
 * @returns {[string,string,string,string,string,string]}
 */
export function getUnits() {
    if (_isTestnet()) {
        return ["TEST"];
    }
    return ["BTS", "USD", "CNY", "BTC", "EUR", "GBP"];
}

export function getDefaultMarket() {
    if (_isTestnet()) {
        return "USD_TEST";
    }
    return "USD_BTS";
}

/**
 * These are the highlighted bases in "My Markets" of the exchange
 *
 * @returns {[string]}
 */
export function getMyMarketsBases() {
    if (_isTestnet()) {
        return ["TEST"];
    }
    return ["BTS", "BTC", "ETH", "USD", "CNY"];
}

/**
 * These are the default quotes that are shown after selecting a base
 *
 * @returns {[string]}
 */
export function getMyMarketsQuotes() {
    if (_isTestnet()) {
        return ["TEST"];
    }
    let tokens = {
        nativeTokens: [
            "BTC",
            "BTS",
            "CNY",
            "EUR",
            "GOLD",
            "KRW",
            "RUBLE",
            "SILVER",
            "USD"
        ],
        bridgeTokens: ["BRIDGE.BCO", "BRIDGE.BTC", "BRIDGE.MONA", "BRIDGE.ZNY"],
        honestTokens: [
            "HONEST.BTC",
            "HONEST.USD",
            "HONEST.CNY",
            "HONEST.XAU",           
            "HONEST.XAG",          
            "HONEST.XRP",
            "HONEST.XRP1",
            "HONEST.ETH",
            "HONEST.ETH1",
        ],
        gdexTokens: [
            "GDEX.BTC",
            "GDEX.BTO",
            "GDEX.EOS",
            "GDEX.ETH",
            "GDEX.BTM",
            "GDEX.NEO",
            "GDEX.GAS",
            "GDEX.QTUM",
            "GDEX.BKBT",
            "GDEX.GXC",
            "GDEX.HPB",
            "GDEX.SEER",
            "GDEX.FOTA",
            "GDEX.JRC",
            "GDEX.EOSDAC",
            "GDEX.MTS",
            "GDEX.GUSD",
            "GDEX.IQ",
            "GDEX.NULS",
            "GDEX.USDT"
        ],
        openledgerTokens: [
            "OBITS",
            "OPEN.BTC",
            "OPEN.DASH",
            "OPEN.DGD",
            "OPEN.DOGE",
            "OPEN.EOS",
            "OPEN.EOSDAC",
            "OPEN.ETH",
            "OPEN.EURT",
            "OPEN.GRC",
            "OPEN.INCNT",
            "OPEN.KRM",
            "OPEN.LISK",
            "OPEN.LTC",
            "OPEN.MAID",
            "OPEN.MKR",
            "OPEN.NEO",
            "OPEN.OMG",
            "OPEN.SBD",
            "OPEN.STEEM",
            "OPEN.TUSD",
            "OPEN.USDT",
            "OPEN.WAVES",
            "OPEN.XMR",
            "OPEN.ZEC",
            "OPEN.ZRX"
        ],
        rudexTokens: [
            "PPY",
            "RUDEX.BTC",
            "RUDEX.ETH",
            "RUDEX.USDT",
            "RUDEX.EOS",
            "RUDEX.GOLOS",
            "RUDEX.GBG",
            "RUDEX.STEEM",
            "RUDEX.SBD",
            "RUDEX.KRM",
            "RUDEX.WLS",
            "RUDEX.SMOKE",
            "RUDEX.GRC"
        ],
        sparkTokens: [
            "ZEPH",
            "PEG.PHP",
            "SPARKDEX.ETH",
            "SPARKDEX.BTC",
            "SPARKDEX.HKD",
            "SPARKDEX.SGD",
            "SPARKDEX.AUD",
            "SPARKDEX.EUR",
            "SPARKDEX.GBP"
        ],
        xbtsxTokens: [
            "XBTSX.STH",
            "XBTSX.POST",
            "XBTSX.DOGE",
            "XBTSX.BTC",
            "XBTSX.BTG",
            "XBTSX.BCH",
            "XBTSX.LTC",
            "XBTSX.DASH",
            "XBTSX.XSPEC",
            "XBTSX.NVC",
            "XBTSX.UNI",
            "XBTSX.NMC",
            "XBTSX.WAVES",
            "XBTSX.COF",
            "XBTSX.MDL",
            "XBTSX.ETH",
            "XBTSX.EXR"
        ],
        otherTokens: [
            "BTWTY",
            "TWENTIX",

            "CVCOIN",
            "HERO",
            "OCT",
            "HERTZ",
            "ICOO",
            "SMOKE",
            "STEALTH",
            "YOYOW"
        ]
    };

    let allTokens = [];
    for (let type in tokens) {
        allTokens = allTokens.concat(tokens[type]);
    }
    return allTokens;
}

/**
 * The featured markets displayed on the landing page of the UI
 *
 * @returns {list of string tuples}
 */
export function getFeaturedMarkets(quotes = []) {
    if (_isTestnet()) {
        return [["USD", "TEST"]];
    }
    return [
        ["USD", "BTS"],
        ["USD", "OPEN.BTC"],
        ["USD", "OPEN.USDT"],
        ["USD", "OPEN.ETH"],
        ["USD", "OPEN.DASH"],
        ["USD", "GOLD"],
        ["USD", "HERO"],
        ["USD", "HONEST.BTC"],
        ["USD", "HONEST.USD"],
        ["USD", "HONEST.CNY"],
        ["USD", "HONEST.XAU"],
        ["USD", "HONEST.XAG"],
        ["USD", "HONEST.XRP"],
        ["USD", "HONEST.ETH"],
        ["USD", "HONEST.XRP1"],
        ["USD", "HONEST.ETH1"],    
        ["USD", "GDEX.BTC"],
        ["USD", "GDEX.ETH"],
        ["USD", "GDEX.EOS"],
        ["USD", "GDEX.BTO"],
        ["USD", "OPEN.EOSDAC"],
        ["USD", "RUDEX.GOLOS"],
        ["USD", "RUDEX.STEEM"],
        ["USD", "RUDEX.EOS"],
        ["USD", "RUDEX.BTC"],
        ["USD", "RUDEX.ETH"],
        ["USD", "RUDEX.USDT"],
        ["USD", "RUDEX.WLS"],
        ["USD", "RUDEX.SMOKE"],        
        ["CNY", "BTS"],
        ["CNY", "OPEN.BTC"],
        ["CNY", "USD"],
        ["CNY", "OPEN.ETH"],
        ["CNY", "YOYOW"],
        ["CNY", "OCT"],
        ["CNY", "HONEST.BTC"],
        ["CNY", "HONEST.USD"],
        ["CNY", "HONEST.CNY"],
        ["CNY", "HONEST.XAU"],
        ["CNY", "HONEST.XAG"],
        ["CNY", "HONEST.XRP"],
        ["CNY", "HONEST.ETH"],
        ["CNY", "HONEST.XRP1"],
        ["CNY", "HONEST.ETH1"],    
        ["CNY", "GDEX.BTC"],
        ["CNY", "GDEX.ETH"],
        ["CNY", "GDEX.EOS"],
        ["CNY", "GDEX.BTO"],
        ["CNY", "GDEX.BTM"],
        ["CNY", "GDEX.SEER"],
        ["CNY", "GDEX.BKBT"],
        ["CNY", "GDEX.USDT"],
        ["CNY", "GDEX.GXC"],
        ["CNY", "RUDEX.GOLOS"],
        ["CNY", "RUDEX.STEEM"],
        ["CNY", "RUDEX.EOS"],
        ["CNY", "RUDEX.BTC"],
        ["CNY", "RUDEX.ETH"],
        ["CNY", "RUDEX.USDT"],
        ["CNY", "RUDEX.WLS"],
        ["CNY", "RUDEX.SMOKE"],
        ["OPEN.BTC", "BTS"],
        ["OPEN.BTC", "OPEN.ETH"],
        ["OPEN.BTC", "OPEN.DASH"],
        ["OPEN.BTC", "OPEN.DGD"],
        ["OPEN.BTC", "OPEN.STEEM"],
        ["BTS", "OPEN.ETH"],
        ["BTS", "OPEN.EOS"],
        ["BTS", "PPY"],
        ["BTS", "OPEN.STEEM"],
        ["BTS", "OBITS"],
        ["BTS", "RUBLE"],
        ["BTS", "HERO"],
        ["BTS", "OCT"],
        ["BTS", "SILVER"],
        ["BTS", "GOLD"],
        ["BTS", "BTWTY"],
        ["BTS", "SMOKE"],
        ["BTS", "GDEX.BTC"],
        ["BTS", "GDEX.ETH"],
        ["BTS", "GDEX.EOS"],
        ["BTS", "GDEX.BTO"],
        ["BTS", "GDEX.USDT"],
        ["BTS", "OPEN.EOSDAC"],
        ["BTS", "HONEST.BTC"],
        ["BTS", "HONEST.USD"],
        ["BTS", "HONEST.CNY"],
        ["BTS", "HONEST.XAU"],
        ["BTS", "HONEST.XAG"],
        ["BTS", "HONEST.XRP"],
        ["BTS", "HONEST.ETH"],
        ["BTS", "HONEST.XRP1"],
        ["BTS", "HONEST.ETH1"],    
        ["BTS", "OPEN.STEEM"],
        ["BTS", "OPEN.MAID"],
        ["OPEN.USDT", "OPEN.BTC"],
        ["OPEN.BTC", "OPEN.MAID"],
        ["RUDEX.USDT", "RUDEX.BTC"],
        ["RUDEX.USDT", "RUDEX.ETH"],
        ["RUDEX.USDT", "RUDEX.EOS"],
        ["RUDEX.BTC", "RUDEX.ETH"],
        ["RUDEX.BTC", "RUDEX.EOS"],
        ["RUDEX.BTC", "RUDEX.STEEM"],
        ["RUDEX.BTC", "RUDEX.GOLOS"],
        ["RUDEX.BTC", "RUDEX.WLS"],
        ["BTS", "OPEN.MAID"],
        ["BTS", "OPEN.HEAT"],
        ["BTS", "OPEN.INCENT"],
        ["RUB", "RUDEX.GOLOS"],
        ["BTS", "RUDEX.GOLOS"],
        ["BTS", "RUDEX.STEEM"],
        ["BTS", "RUDEX.EOS"],
        ["BTS", "RUDEX.BTC"],
        ["BTS", "RUDEX.ETH"],
        ["BTS", "RUDEX.USDT"],
        ["BTS", "RUDEX.WLS"],
        ["BTS", "RUDEX.SMOKE"],
        ["BTS", "XBTSX.STH"],
        ["BTS", "XBTSX.WAVES"],
        ["BTS", "ZEPH"],
        ["BTS", "HERTZ"],
        ["BTS", "SPARKDEX.BTC"],
        ["BTS", "SPARKDEX.ETH"],
        ["BTS", "SPARKDEX.HKD"],
        ["SPARKDEX.HKD", "SPARKDEX.BTC"],
        ["SPARKDEX.HKD", "SPARKDEX.ETH"],
        ["BTS", "SPARKDEX.SGD"],
        ["BTS", "SPARKDEX.AUD"],
        ["BTS", "SPARKDEX.EUR"],
        ["BTS", "SPARKDEX.GBP"],
        ["BTS", "PEG.PHP"],
        ["RUDEX.BTC", "HONEST.BTC"],
        ["GDEX.BTC", "HONEST.BTC"],
        ["XBTSX.BTC", "HONEST.BTC"],
        ["DEEX.BTC", "HONEST.BTC"],
        ["OPEN.BTC", "HONEST.BTC"],
    ].filter(a => {
        if (!quotes.length) return true;
        return quotes.indexOf(a[0]) !== -1;
    });
}

/**
 * Recognized namespaces of assets
 *
 * @returns {[string,string,string,string,string,string,string]}
 */
export function getAssetNamespaces() {
    if (_isTestnet()) {
        return [];
    }
    return [
        "OPEN.",
        "RUDEX.",
        "BRIDGE.",
        "GDEX.",
        "XBTSX.",
        "SPARKDEX.",
        "CITADEL."
        "HONEST."
    ];
}

/**
 * These namespaces will be hidden to the user, this may include "bit" for BitAssets
 * @returns {[string,string]}
 */
export function getAssetHideNamespaces() {
    // e..g "OPEN.", "bit"
    return [];
}

/**
 * Allowed gateways that the user will be able to choose from in Deposit Withdraw modal
 * @param gateway
 * @returns {boolean}
 */
export function allowedGateway(gateway) {
    const allowedGateways = [
        "TRADE",
        "OPEN",
        "RUDEX",
        "BRIDGE",
        "GDEX",
        "XBTSX",
        "SPARKDEX",
        "CITADEL"
    ];
    if (!gateway) {
        // answers the question: are any allowed?
        return allowedGateways.length > 0;
    }
    return allowedGateways.indexOf(gateway) >= 0;
}

export function getSupportedLanguages() {
    // not yet supported
}

export function getAllowedLogins() {
    // possible: list containing any combination of ["password", "wallet"]
    return ["password", "wallet"];
}

export function getConfigurationAsset() {
    let assetSymbol = null;
    if (_isTestnet()) {
        assetSymbol = "NOTIFICATIONS";
    } else {
        assetSymbol = "TEST";
    }
    // explanation will be parsed out of the asset description (via split)
    return {
        symbol: assetSymbol,
        explanation:
            "This asset is used for decentralized configuration of the BitShares UI placed under bitshares.org."
    };
}
