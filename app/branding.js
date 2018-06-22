export function getWalletName() {
    return "BitShares";
}

export function getWalletURL() {
    return "https://wallet.bitshares.org";
}

export function getLogo() {
    return require("assets/logo-ico-blue.png");
}

export function getDefaultTheme() {
    // possible ["darkTheme", "lightTheme", "midnightTheme"]
    return "darkTheme";
}

export function getDefaultLogin() {
    // possible: one of "password", "wallet"
    return "password";
}

export function getUnits() {
    return ["BTS", "USD", "CNY", "BTC", "EUR", "GBP"];
}

export function getMyMarketsBases() {
    return ["USD", "OPEN.BTC", "CNY", "BTS", "BTC"];
}

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

export function getAssetNamespaces() {
    return ["TRADE.", "OPEN.", "METAEX.", "BRIDGE.", "RUDEX.", "GDEX.", "WIN."];
}

export function getAssetHideNamespaces() {
    return ["OPEN.", "bit"];
}

export function getSupportedLanguages() {
    // not yet supported
}

export function allowedLogin(type) {
    // not yet supported

    // possible: list containing any combination of ["password", "wallet"]
    return type == "password";
}

export function allowedGateway(gateway) {
    return gateway in ["OPEN", "RUDEX", "WIN", "BRIDGE", "GDEX"];
}
