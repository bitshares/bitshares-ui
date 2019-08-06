/**
 * Settings storage for all Gateway Services
 * General API Settings are stored in api/apiConfig and should be imported here
 */

import {
    rudexAPIs,
    bitsparkAPIs,
    widechainAPIs,
    openledgerAPIs,
    cryptoBridgeAPIs,
    gdex2APIs,
    xbtsxAPIs,
    citadelAPIs
} from "api/apiConfig";
import {allowedGateway} from "branding";
import {getGateways} from "../chain/onChainConfig";
//const temp = getGateways().OPEN.enabled;
export const availableApis = {
    OPEN: openledgerAPIs,
    RUDEX: rudexAPIs,
    SPARKDEX: bitsparkAPIs,
    BRIDGE: cryptoBridgeAPIs,
    GDEX: gdex2APIs,
    XBTSX: xbtsxAPIs,
    CITADEL: citadelAPIs
};

export const availableGateways = {
    OPEN: {
        id: "OPEN",
        name: "OPENLEDGER",
        baseAPI: openledgerAPIs,
        isEnabled: getGateways().OPEN
            ? getGateways().OPEN.enabled
            : allowedGateway("OPEN"),
        selected: false,
        options: {
            enabled: false,
            selected: false
        }
    },
    RUDEX: {
        id: "RUDEX",
        name: "RUDEX",
        baseAPI: rudexAPIs,
        isEnabled: getGateways().RUDEX
            ? getGateways().RUDEX.enabled
            : allowedGateway("RUDEX"),
        isSimple: true,
        selected: false,
        simpleAssetGateway: true,
        fixedMemo: {prepend: "dex:", append: ""},
        addressValidatorMethod: "POST",
        options: {
            enabled: false,
            selected: false
        }
    },
    SPARKDEX: {
        id: "SPARKDEX",
        name: "SPARKDEX",
        baseAPI: bitsparkAPIs,
        isEnabled: getGateways().SPARKDEX
            ? getGateways().SPARKDEX.enabled
            : allowedGateway("SPARKDEX"),
        selected: false,
        options: {
            enabled: false,
            selected: false
        }
    },
    BRIDGE: {
        id: "BRIDGE",
        name: "CRYPTO-BRIDGE",
        baseAPI: cryptoBridgeAPIs,
        isEnabled: getGateways().BRIDGE
            ? getGateways().BRIDGE.enabled
            : allowedGateway("BRIDGE"),
        selected: false,
        singleWallet: true, // Has no coresponging coinType == backingCoinType specific wallet
        addressValidatorAsset: true, // Address validator requires output_asset parameter
        useFullAssetName: true, // Adds <gateway>.<asset> to memo and address object
        intermediateAccount: "cryptobridge", // Fixed intermediateAccount
        options: {
            enabled: false,
            selected: false
        }
    },
    GDEX: {
        id: "GDEX",
        name: "GDEX",
        baseAPI: gdex2APIs,
        isEnabled: getGateways().GDEX
            ? getGateways().GDEX.enabled
            : allowedGateway("GDEX"),
        options: {
            enabled: false,
            selected: false
        }
    },
    XBTSX: {
        id: "XBTSX",
        name: "XBTSX",
        baseAPI: xbtsxAPIs,
        isEnabled: getGateways().XBTSX
            ? getGateways().XBTSX.enabled
            : allowedGateway("XBTSX"),
        isSimple: true,
        selected: false,
        simpleAssetGateway: false,
        addressValidatorMethod: "POST",
        options: {
            enabled: false,
            selected: false
        }
    },
    CITADEL: {
        id: "CITADEL",
        name: "CITADEL",
        baseAPI: citadelAPIs,
        isEnabled: getGateways().CITADEL
            ? getGateways().CITADEL.enabled
            : allowedGateway("CITADEL"),
        selected: false,
        assetWithdrawlAlias: {monero: "xmr"}, // if asset name doesn't equal to memo
        options: {
            enabled: false,
            selected: false
        }
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
