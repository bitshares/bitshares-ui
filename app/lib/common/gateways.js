/**
 * Settings storage for all Gateway Services
 * General API Settings are stored in api/apiConfig and should be imported here
 */

import {rudexAPIs, widechainAPIs, openledgerAPIs} from "api/apiConfig";

export function getAvailableGateways() {
    return {
        OPEN: {
            id: "OPEN",
            name: "OPENLEDGER",
            enabled: false,
            selected: false,
            baseAPI: openledgerAPIs
        },
        RUDEX: {
            id: "RUDEX",
            name: "RUDEX",
            enabled: false,
            selected: false,
            baseAPI: rudexAPIs
        },
        WIN: {
            id: "WIN",
            name: "Winex",
            enabled: false,
            selected: false,
            baseAPI: widechainAPIs
        }

    };
}



