import React from "react";
import ReactDOM from "react-dom";
import AppInit from "./AppInit";
import {ChainConfig} from "bitsharesjs-ws";

/* ADD CRYPTOBRIDGE TEST TO CHAIN CONFIG */
ChainConfig.networks.CryptoBridgeTest = {
    core_asset: "BTS",
    address_prefix: "BTS",
    chain_id: "2821abbb9923c830cf8300136c431674756270d9019f56c00e80b296e3afc079"
};

const rootEl = document.getElementById("content");
const render = () => {
    ReactDOM.render(<AppInit />, rootEl);
};
render();
