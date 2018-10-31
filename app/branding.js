/** This file centralized customization and branding efforts throughout the whole wallet and is meant to facilitate
 *  the process.
 *
 *  @author Stefan Schiessl <stefan.schiessl@blockchainprojectsbv.com>
 */

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
export function getUnits(chainId = "4018d784") {
    if (chainId === "4018d784")
        return ["BTS", "USD", "CNY", "BTC", "EUR", "GBP"];
    else if (chainId === "39f5e2ed") return ["TEST"];
}

/**
 * These are the highlighted bases in "My Markets" of the exchange
 *
 * @returns {[string]}
 */

export function getMyMarketsBases() {
    return ["BTC", "ETH", "BTS", "USD", "CNY"];
}

/**
 * These are the default quotes that are shown after selecting a base
 *
 * @returns {[string]}
 */
export function getMyMarketsQuotes() {
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
        gdexTokens: ["GDEX.BTC", "GDEX.BTO", "GDEX.EOS", "GDEX.ETH"],
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
            "OPEN.GAME",
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
            "RUDEX.DCT",
            "RUDEX.DGB",
            "RUDEX.GBG",
            "RUDEX.GOLOS",
            "RUDEX.KRM",
            "RUDEX.MUSE",
            "RUDEX.SBD",
            "RUDEX.STEEM",
            "RUDEX.TT"
        ],
        sparkTokens: ["ZEPH", "SPARKDEX.ETH", "SPARKDEX.BTC"],
        winTokens: ["WIN.ETC", "WIN.ETH", "WIN.HSR"],
        xbtsxTokens: [
            "XBTSX.STH",
            "XBTSX.POST",
            "XBTSX.DOGE",
            "XBTSX.BTC",
            "XBTSX.LTC",
            "XBTSX.DASH",
            "XBTSX.KEC",
            "XBTSX.BCH",
            "XBTSX.BTG",
            "XBTSX.XSPEC",
            "XBTSX.NVC"
        ],
        otherTokens: [
            "BKT",
            "BLOCKPAY",
            "BTWTY",
            "TWENTIX",
            "BTSR",
            "CADASTRAL",
            "CVCOIN",
            "HEMPSWEET",
            "HERO",
            "HERTZ",
            "ICOO",
            "IOU.CNY",
            "KAPITAL",
            "KEXCOIN",
            "OCT",
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
    return [
        ["USD", "BTS"],
        ["USD", "OPEN.BTC"],
        ["USD", "OPEN.USDT"],
        ["USD", "OPEN.ETH"],
        ["USD", "OPEN.DASH"],
        ["USD", "GOLD"],
        ["USD", "HERO"],
        ["USD", "GDEX.BTC"],
        ["USD", "GDEX.ETH"],
        ["USD", "GDEX.EOS"],
        ["USD", "GDEX.BTO"],
        ["USD", "OPEN.EOSDAC"],
        ["CNY", "BTS"],
        ["CNY", "OPEN.BTC"],
        ["CNY", "USD"],
        ["CNY", "OPEN.ETH"],
        ["CNY", "YOYOW"],
        ["CNY", "OCT"],
        ["CNY", "GDEX.BTC"],
        ["CNY", "GDEX.ETH"],
        ["CNY", "GDEX.EOS"],
        ["CNY", "GDEX.BTO"],
        ["CNY", "GDEX.BTM"],
        ["OPEN.BTC", "BTS"],
        ["OPEN.BTC", "OPEN.ETH"],
        ["OPEN.BTC", "OPEN.DASH"],
        ["OPEN.BTC", "BLOCKPAY"],
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
        ["BTS", "BLOCKPAY"],
        ["BTS", "BTWTY"],
        ["BTS", "SMOKE"],
        ["BTS", "GDEX.BTC"],
        ["BTS", "GDEX.ETH"],
        ["BTS", "GDEX.EOS"],
        ["BTS", "GDEX.BTO"],
        ["BTS", "OPEN.EOSDAC"],
        ["KAPITAL", "OPEN.BTC"],
        ["USD", "OPEN.STEEM"],
        ["USD", "OPEN.MAID"],
        ["OPEN.USDT", "OPEN.BTC"],
        ["OPEN.BTC", "OPEN.MAID"],
        ["BTS", "OPEN.MAID"],
        ["BTS", "OPEN.HEAT"],
        ["BTS", "OPEN.INCENT"],
        ["HEMPSWEET", "OPEN.BTC"],
        ["KAPITAL", "BTS"],
        ["BTS", "RUDEX.STEEM"],
        ["USD", "RUDEX.STEEM"],
        ["BTS", "RUDEX.SBD"],
        ["BTS", "RUDEX.KRM"],
        ["USD", "RUDEX.KRM"],
        ["RUBLE", "RUDEX.GOLOS"],
        ["CNY", "RUDEX.GOLOS"],
        ["RUBLE", "RUDEX.GBG"],
        ["CNY", "RUDEX.GBG"],
        ["BTS", "RUDEX.MUSE"],
        ["BTS", "RUDEX.TT"],
        ["BTS", "RUDEX.SCR"],
        ["BTS", "RUDEX.ETH"],
        ["BTS", "RUDEX.DGB"],
        ["BTS", "XBTSX.STH"],
        ["BTS", "ZEPH"],
        ["BTS", "HERTZ"],
        ["BTS", "SPARKDEX.BTC"],
        ["BTS", "SPARKDEX.ETH"]
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
    return [
        "OPEN.",
        "RUDEX.",
        "WIN.",
        "BRIDGE.",
        "GDEX.",
        "XBTSX.",
        "SPARKDEX.",
        "CITADEL."
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
    return (
        [
            "OPEN",
            "RUDEX",
            "WIN",
            "BRIDGE",
            "GDEX",
            "XBTSX",
            "SPARKDEX",
            "CITADEL"
        ].indexOf(gateway) >= 0
    );
}

export function getSupportedLanguages() {
    // not yet supported
}

export function getAllowedLogins() {
    // possible: list containing any combination of ["password", "wallet"]
    return ["password", "wallet"];
}
