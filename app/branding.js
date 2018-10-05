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
    return "Tatch Cloud Wallet";
}

/**
 * URL of this wallet
 * @returns {string}
 */
export function getWalletURL() {
    return "https://wallet.tatchcapital.com";
}

/**
 * Returns faucet information
 *
 * @returns {{url: string, show: boolean}}
 */
export function getFaucet() {
    return {
        url: "https://faucet.bitshares.eu/3a2df26c1bc74473", // 2017-12-infrastructure worker proposal
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
    return "midnightTheme";
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
        return ["BTS", "USD", "CNY", "BTC", "EUR", "BRIDGE.NLG"];
    else if (chainId === "39f5e2ed") return ["TEST"];
}

/**
 * These are the highlighted bases in "My Markets" of the exchange
 *
 * @returns {[string]}
 */

export function getMyMarketsBases() {
    return ["BRIDGE.NLG", "BRIDGE.BTC", "OPEN.ETH"];
}

/**
 * These are the default quotes that are shown after selecting a base
 *
 * @returns {[string]}
 */
export function getMyMarketsQuotes() {
    let tokens = {
        nativeTokens: [
            "BTS",
            "CNY",
            "EUR",
            "USD"
        ],
        bridgeTokens: [
            "BRIDGE.BCO", 
            "BRIDGE.BTC",
            "BRIDGE.LTC",
            "BRIDGE.NLG",
	    "BRIDGE.WSP",
	    "BRIDGE.PIVX"

        ],
        tatchTokens: [
            "TATCHCOIN",
            "TCLGULDEN",
            "TCLSILVER",
         ],
        openledgerTokens: [
            "OBITS",
            "OPEN.DASH",
            "OPEN.DGD",
            "OPEN.DOGE",
            "OPEN.EOS",
            "OPEN.EOSDAC",
            "OPEN.ETH",
            "OPEN.LISK",
            "OPEN.MAID",
            "OPEN.NEO",
            "OPEN.OMG",
            "OPEN.SBD",
            "OPEN.STEEM",
            "OPEN.WAVES",
            "OPEN.XMR",
            "OPEN.ZEC",
            "OPEN.ZRX"
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
        ["BTS","BRIDGE.BTC"],	
	["EUR","BRIDGE.BTC"],
    	["USD","BRIDGE.BTC"],
    	["CNY","BRIDGE.BTC"],
	["BRIDGE.BCO","BRIDGE.BTC"],
    	["BRIDGE.LTC","BRIDGE.BTC"],
	["BRIDGE.NLG","BRIDGE.BTC"],
	["TATCHCOIN","BRIDGE.BTC"],
	["TCLGULDEN","BRIDGE.BTC"],
	["TCLSILVER","BRIDGE.BTC"],
	["OBITS","BRIDGE.BTC"],
	["OPEN.DASH","BRIDGE.BTC"],
	["OPEN.DGD","BRIDGE.BTC"],
	["OPEN.DOGE","BRIDGE.BTC"],
	["OPEN.EOS","BRIDGE.BTC"],
	["OPEN.EOSDAC","BRIDGE.BTC"],
	["OPEN.ETH","BRIDGE.BTC"],
	["OPEN.LISK","BRIDGE.BTC"],
	["OPEN.MAID","BRIDGE.BTC"],
	["OPEN.NEO","BRIDGE.BTC"],
	["OPEN.OMG","BRIDGE.BTC"],
	["OPEN.SBD","BRIDGE.BTC"],
	["OPEN.STEEM","BRIDGE.BTC"],
	["OPEN.WAVES","BRIDGE.BTC"],
	["OPEN.XMR","BRIDGE.BTC"],
	["OPEN.ZEC","BRIDGE.BTC"],
	["OPEN.ZRX","BRIDGE.BTC"],
	["BRIDGE.BTC","BRIDGE.NLG"],
	["BTS","BRIDGE.NLG"],
	["EUR","BRIDGE.NLG"],
	["USD","BRIDGE.NLG"],
	["CNY","BRIDGE.NLG"],
	["BRIDGE.BCO","BRIDGE.NLG"],
	["BRIDGE.LTC","BRIDGE.NLG"],
	["BRIDGE.BTC","BRIDGE.NLG"],
	["BTS","BRIDGE.NLG"],
	["EUR","BRIDGE.NLG"],
	["USD","BRIDGE.NLG"],
	["CNY","BRIDGE.NLG"],
	["BRIDGE.BCO","BRIDGE.NLG"],
	["BRIDGE.LTC","BRIDGE.NLG"],
	["TATCHCOIN","BRIDGE.NLG"],
	["TCLGULDEN","BRIDGE.NLG"],
	["TCLSILVER","BRIDGE.NLG"],
	["OBITS","BRIDGE.NLG"],
	["OPEN.DASH","BRIDGE.NLG"],
	["OPEN.DGD","BRIDGE.NLG"],
	["OPEN.DOGE","BRIDGE.NLG"],
	["OPEN.EOS","BRIDGE.NLG"],
	["OPEN.EOSDAC","BRIDGE.NLG"],
	["OPEN.ETH","BRIDGE.NLG"],
	["OPEN.LISK","BRIDGE.NLG"],
	["OPEN.MAID","BRIDGE.NLG"],
	["OPEN.NEO","BRIDGE.NLG"],
	["OPEN.OMG","BRIDGE.NLG"],
	["OPEN.SBD","BRIDGE.NLG"],
	["OPEN.STEEM","BRIDGE.NLG"],
	["OPEN.WAVES","BRIDGE.NLG"],
	["OPEN.XMR","BRIDGE.NLG"],
	["OPEN.ZEC","BRIDGE.NLG"],
	["OPEN.ZRX","BRIDGE.NLG"],
	["BRIDGE.BTC","EUR"],
	["BTS","EUR"],
	["USD","EUR"],
	["CNY","EUR"],
	["BRIDGE.BCO","EUR"],
	["BRIDGE.LTC","EUR"],
	["BRIDGE.NLG","EUR"],
	["TATCHCOIN","EUR"],
	["TCLGULDEN","EUR"],
	["TCLSILVER","EUR"],
	["OBITS","EUR"],
	["OPEN.DASH","EUR"],
	["OPEN.DGD","EUR"],
	["OPEN.DOGE","EUR"],
	["OPEN.EOS","EUR"],
	["OPEN.EOSDAC","EUR"],
	["OPEN.ETH","EUR"],
	["OPEN.LISK","EUR"],
	["OPEN.MAID","EUR"],
	["OPEN.NEO","EUR"],
	["OPEN.OMG","EUR"],
	["OPEN.SBD","EUR"],
	["OPEN.STEEM","EUR"],
	["OPEN.WAVES","EUR"],
	["OPEN.XMR","EUR"],
	["OPEN.ZEC","EUR"],
	["OPEN.ZRX","EUR"],
	["BRIDGE.BTC","USD"],
	["BTS","USD"],
	["EUR","USD"],
	["CNY","USD"],
	["BRIDGE.BCO","USD"],
	["BRIDGE.LTC","USD"],
	["BRIDGE.NLG","USD"],
	["TATCHCOIN","USD"],
	["TCLGULDEN","USD"],
	["TCLSILVER","USD"],
	["OBITS","USD"],
	["OPEN.DASH","USD"],
	["OPEN.DGD","USD"],
	["OPEN.DOGE","USD"],
	["OPEN.EOS","USD"],
	["OPEN.EOSDAC","USD"],
	["OPEN.ETH","USD"],
	["OPEN.LISK","USD"],
	["OPEN.MAID","USD"],
	["OPEN.NEO","USD"],
	["OPEN.OMG","USD"],
	["OPEN.SBD","USD"],
	["OPEN.STEEM","USD"],
	["OPEN.WAVES","USD"],
	["OPEN.XMR","USD"],
	["OPEN.ZEC","USD"],
	["OPEN.ZRX","USD"],
	["BRIDGE.BTC","OPEN.ETH"],
	["BTS","OPEN.ETH"],
	["EUR","OPEN.ETH"],
	["USD","OPEN.ETH"],
	["CNY","OPEN.ETH"],
	["BRIDGE.BCO","OPEN.ETH"],
	["BRIDGE.LTC","OPEN.ETH"],
	["BRIDGE.NLG","OPEN.ETH"],
	["TATCHCOIN","OPEN.ETH"],
	["TCLGULDEN","OPEN.ETH"],
	["TCLSILVER","OPEN.ETH"],
	["OBITS","OPEN.ETH"],
	["OPEN.DASH","OPEN.ETH"],
	["OPEN.DGD","OPEN.ETH"],
	["OPEN.DOGE","OPEN.ETH"],
	["OPEN.EOS","OPEN.ETH"],
	["OPEN.EOSDAC","OPEN.ETH"],
	["OPEN.LISK","OPEN.ETH"],
	["OPEN.MAID","OPEN.ETH"],
	["OPEN.NEO","OPEN.ETH"],
	["OPEN.OMG","OPEN.ETH"],
	["OPEN.SBD","OPEN.ETH"],
	["OPEN.STEEM","OPEN.ETH"],
	["OPEN.WAVES","OPEN.ETH"],
	["OPEN.XMR","OPEN.ETH"],
	["OPEN.ZEC","OPEN.ETH"],
	["OPEN.ZRX","OPEN.ETH"]
    ]
}

/**
 * Recognized namespaces of assets
 *
 * @returns {[string,string,string,string,string,string,string]}
 */
export function getAssetNamespaces() {
    return [
        "OPEN.",
        "BRIDGE."
    ];
}

/**
 * These namespaces will be hidden to the user, this may include "bit" for BitAssets
 * @returns {[string,string]}
 */
export function getAssetHideNamespaces() {
    // e..g "OPEN.", "bit"
    return [
	    "BRIDGE."
    ];
}

/**
 * Allowed gateways that the user will be able to choose from in Deposit Withdraw modal
 * @param gateway
 * @returns {boolean}
 */
export function allowedGateway(gateway) {
    return (
        ["OPEN", "BRIDGE"]
    );
}

export function getSupportedLanguages() {
    // not yet supported
}

export function getAllowedLogins() {
    // possible: list containing any combination of ["password", "wallet"]
    return ["password", "wallet"];
}
