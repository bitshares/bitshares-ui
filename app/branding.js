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
    return ["BTS", "USD", "CNY", "BTC", "EUR", "GBP"];
}

/**
 * These are the highlighted bases in "My Markets" of the exchange
 *
 * @returns {[string]}
 */

export function getMyMarketsBases() {
    return ["USD", "OPEN.BTC", "CNY", "BTS", "BTC"];
}

/**
 * These are the default quotes that are shown after selecting a base
 *
 * @returns {[string]}
 */
export function getMyMarketsQuotes() {
    return [
        "BTS",
        //
        "BKT",
        "BLOCKPAY",
        "BRIDGE.BCO",
        "BRIDGE.BTC",
        "BRIDGE.MONA",
        "BRIDGE.ZNY",
        "BTC",
        "BTSR",
        "BTWTY",
        "CADASTRAL",
        "CNY",
        "CVCOIN",
        "EUR",
        "GDEX.BTC",
        "GDEX.BTO",
        "GDEX.EOS",
        "GDEX.ETH",
        "GOLD",
        "HERO",
        "ICOO",
        "IOU.CNY",
        "KAPITAL",
        "KEXCOIN",
        "OBITS",
        "OCT",
        "OPEN.BTC",
        "OPEN.DASH",
        "OPEN.DGD",
        "OPEN.DOGE",
        "OPEN.EOS",
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
        "OPEN.ZEC",
        "OPEN.ZRX",
        "PPY",
        "RUBLE",
        "RUDEX.DCT",
        "RUDEX.GBG",
        "RUDEX.GOLOS",
        "RUDEX.KRM",
        "RUDEX.MUSE",
        "RUDEX.SBD",
        "RUDEX.STEEM",
        "SILVER",
        "SMOKE",
        "STEALTH",
        "USD",
        "WIN.ETC",
        "WIN.ETH",
        "WIN.HSR",
        "YOYOW"
    ];
}

/**
 * Recognized namespaces of assets
 *
 * @returns {[string,string,string,string,string,string,string]}
 */
export function getAssetNamespaces() {
    return ["TRADE.", "OPEN.", "METAEX.", "BRIDGE.", "RUDEX.", "GDEX.", "WIN."];
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
    return gateway in ["OPEN", "RUDEX", "WIN", "BRIDGE", "GDEX"];
}

export function getSupportedLanguages() {
    // not yet supported
}

export function allowedLogin(type) {
    // not yet supported

    // possible: list containing any combination of ["password", "wallet"]
    return type == "password";
}
