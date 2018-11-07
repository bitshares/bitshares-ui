import React from "react";
import ReactDOM from "react-dom";
import AppInit from "./AppInit";
import {ChainConfig} from "bitsharesjs-ws";

if (__TESTNET__) {
    /* ADD CRYPTOBRIDGE TEST TO CHAIN CONFIG */
    ChainConfig.networks.CryptoBridgeTest = {
        core_asset: "BTS",
        address_prefix: "BTS",
        chain_id:
            "2821abbb9923c830cf8300136c431674756270d9019f56c00e80b296e3afc079"
    };
}
if (__DEVNET__) {
    /* ADD CRYPTOBRIDGE DEV TO CHAIN CONFIG */
    ChainConfig.networks.CryptoBridgeDev = {
        core_asset: "BTS",
        address_prefix: "BTS",
        chain_id:
            "92e31f3a1e262c773eb2d3d7741b0d7a75ff91ded998759fb1611014d9310378"
    };
}

const rootEl = document.getElementById("content");
const render = () => {
    ReactDOM.render(<AppInit />, rootEl);
};
render();
