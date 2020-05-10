/**
 * Settings storage for all Gateway Services
 * General API Settings are stored in api/apiConfig and should be imported here
 */

import {
    rudexAPIs,
    bitsparkAPIs,
    openledgerAPIs,
    cryptoBridgeAPIs,
    gdex2APIs,
    xbtsxAPIs,
    citadelAPIs
} from "api/apiConfig";
import {allowedGateway} from "branding";
import {isGatewayTemporarilyDisabled} from "../chain/onChainConfig";
import SettingsStore from "stores/SettingsStore";

const _isEnabled = gatewayKey => {
    return async function(options = {}) {
        if (__DEV__) {
            console.log("Checking " + gatewayKey + " gateway ...");
        }
        if (!options.onlyOnChainConfig) {
            // is the gateway configured in branding?
            const setInBranding = allowedGateway(gatewayKey);
            if (!setInBranding) {
                if (__DEV__) {
                    console.log("  ... disabled in branding.js");
                }
                return false;
            } else {
                if (!!options.onlyBranding) {
                    if (__DEV__) {
                        console.log("  ... may be used!");
                    }
                    return true;
                }
            }
        }
        // is it deactivated on-chain?
        const temporarilyDisabled = await isGatewayTemporarilyDisabled(
            gatewayKey
        );
        if (temporarilyDisabled) {
            if (__DEV__) {
                console.log("  ... disabled on-chain");
            }
            return false;
        } else {
            if (!!options.onlyOnChainConfig) {
                if (__DEV__) {
                    console.log("  ... may be used!");
                }
                return true;
            }
        }
        // has the user filtered it out?
        let filteredServiceProviders = SettingsStore.getState().settings.get(
            "filteredServiceProviders",
            []
        );
        if (!filteredServiceProviders) {
            filteredServiceProviders = [];
        }
        let userAllowed = false;
        if (
            filteredServiceProviders.length == 1 &&
            filteredServiceProviders[0] == "all"
        ) {
            userAllowed = true;
        } else {
            userAllowed = filteredServiceProviders.indexOf(gatewayKey) >= 0;
        }
        if (!userAllowed) {
            if (__DEV__) {
                console.log("  ... disabled by user");
            }
            return false;
        }
        if (__DEV__) {
            console.log("  ... may be used!");
        }
        return true;
    };
};

export const availableGateways = {
    OPEN: {
        id: "OPEN",
        name: "OpenLedger",
        baseAPI: openledgerAPIs,
        isEnabled: () => false,
        selected: false,
        options: {
            enabled: false,
            selected: false
        },
        landing:
            "https://dex.openledger.io/news/ol-dex-is-closing-all-activities/",
        wallet: "Shutdown"
    },
    RUDEX: {
        id: "RUDEX",
        name: "RuDEX",
        baseAPI: rudexAPIs,
        isEnabled: _isEnabled("RUDEX"),
        isSimple: true,
        selected: false,
        simpleAssetGateway: true,
        fixedMemo: {
            prepend_default: "dex:",
            prepend_btsid: "btsid-",
            append: ""
        },
        addressValidatorMethod: "POST",
        options: {
            enabled: false,
            selected: false
        },
        landing: "https://rudex.org/",
        wallet: "https://market.rudex.org/"
    },
    SPARKDEX: {
        id: "SPARKDEX",
        name: "BitSpark",
        baseAPI: bitsparkAPIs,
        isEnabled: _isEnabled("SPARKDEX"),
        selected: false,
        options: {
            enabled: false,
            selected: false
        },
        landing: "https://www.bitspark.io/for-traders",
        wallet: "https://dex.bitspark.io/"
    },
    BRIDGE: {
        id: "BRIDGE",
        name: "CryptoBridge",
        baseAPI: cryptoBridgeAPIs,
        isEnabled: () => false,
        selected: false,
        singleWallet: true, // Has no coresponging coinType == backingCoinType specific wallet
        addressValidatorAsset: true, // Address validator requires output_asset parameter
        useFullAssetName: true, // Adds <gateway>.<asset> to memo and address object
        intermediateAccount: "cryptobridge", // Fixed intermediateAccount
        options: {
            enabled: false,
            selected: false
        },
        landing: "Shutdown",
        wallet: "Shutdown"
    },
    GDEX: {
        id: "GDEX",
        name: "GDEX",
        baseAPI: gdex2APIs,
        isEnabled: _isEnabled("GDEX"),
        options: {
            enabled: false,
            selected: false
        },
        wallet: "https://www.gdex.io/"
    },
    XBTSX: {
        id: "XBTSX",
        name: "XBTS",
        baseAPI: xbtsxAPIs,
        isEnabled: _isEnabled("XBTSX"),
        isSimple: true,
        selected: false,
        addressValidatorMethod: "POST",
        options: {
            enabled: false,
            selected: false
        },
        landing: "https://xbts.io/",
        wallet: "https://ex.xbts.io/"
    },
    CITADEL: {
        id: "CITADEL",
        name: "Citadel",
        baseAPI: citadelAPIs,
        isEnabled: _isEnabled("CITADEL"),
        selected: false,
        assetWithdrawlAlias: {monero: "xmr"}, // if asset name doesn't equal to memo
        options: {
            enabled: false,
            selected: false
        },
        landing: "https://citadel.li/",
        wallet: "https://citadel.li/wallet/"
    }
};

export const availableBridges = {
    TRADE: {
        id: "TRADE",
        name: "Blocktrades",
        isEnabled: _isEnabled("TRADE"),
        landing: "https://blocktrades.us"
    }
};

export const gatewayPrefixes = Object.keys(availableGateways);

export function getPossibleGatewayPrefixes(bases) {
    return gatewayPrefixes.reduce((assets, prefix) => {
        bases.forEach(a => {
            assets.push(`${prefix}.${a}`);
        });
        return assets;
    }, []);
}

export default availableGateways;
