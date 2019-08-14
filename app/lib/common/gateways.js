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
    citadelAPIs,
    deexAPIs
} from "api/apiConfig";
import {allowedGateway} from "branding";
import {isGatewayTemporarilyDisabled} from "../chain/onChainConfig";

const _isEnabled = gatewayKey => {
    return async function() {
        const allowed = allowedGateway(gatewayKey);
        if (allowed) {
            const temporarilyDisabled = await isGatewayTemporarilyDisabled(
                gatewayKey
            );
            if (temporarilyDisabled) {
                return false;
            }
            return true;
        }
        return false;
    };
};

export const availableGateways = {
    OPEN: {
        id: "OPEN",
        name: "OPENLEDGER",
        baseAPI: openledgerAPIs,
        isEnabled: () => false,
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
        isEnabled: _isEnabled("RUDEX"),
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
        isEnabled: _isEnabled("SPARKDEX"),
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
        isEnabled: _isEnabled("BRIDGE"),
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
        isEnabled: _isEnabled("GDEX"),
        options: {
            enabled: false,
            selected: false
        }
    },
    XBTSX: {
        id: "XBTSX",
        name: "XBTSX",
        baseAPI: xbtsxAPIs,
        isEnabled: _isEnabled("XBTSX"),
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
        isEnabled: _isEnabled("CITADEL"),
        selected: false,
        assetWithdrawlAlias: {monero: "xmr"}, // if asset name doesn't equal to memo
        options: {
            enabled: false,
            selected: false
        }
    },
    DEEX: {
        id: "DEEX",
        name: "DEEX",
        baseAPI: deexAPIs,
        isSimple: true,
        simpleAssetGateway: false,
        fixedMemo: {prepend: "dex:", append: ""},
        isEnabled: allowedGateway("DEEX"),
        addressValidatorMethod: "POST",
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
