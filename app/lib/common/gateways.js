/**
 * Settings storage for all Gateway Services
 * General API Settings are stored in api/apiConfig and should be imported here
 */

import {
    rudexAPIs,
    widechainAPIs,
    openledgerAPIs,
    cryptoBridgeAPIs
} from "api/apiConfig";

export const availableGateways = {
    OPEN: {
        id: "OPEN",
        name: "OPENLEDGER",
        baseAPI: openledgerAPIs,
        isEnabled: true,
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
        isEnabled: true,
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
    WIN: {
        id: "WIN",
        name: "Winex",
        baseAPI: widechainAPIs,
        isEnabled: true,
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
        isEnabled: true,
        selected: false,
        singleWallet: true, // Has no coresponging coinType == backingCoinType specific wallet
        addressValidatorAsset: true, // Address validator requires output_asset parameter
        useFullAssetName: true, // Adds <gateway>.<asset> to memo and address object
        intermediateAccount: "cryptobridge", // Fixed intermediateAccount
        options: {
            enabled: false,
            selected: false
        }
    }
};

export default availableGateways;
