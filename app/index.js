import React from "react";
import ReactDOM from "react-dom";
import {Router, browserHistory, hashHistory} from "react-router/es";
import {ChainConfig} from "bitsharesjs-ws";
/*
* Routes-dev is only needed for react hot reload, as this does not work with
* the async routes defined in Routes.jsx. Any changes to the routes must be kept
* synchronized between the two files
*/
import routes from "./Routes";

// require("./components/Utility/Prototypes"); // Adds a .equals method to Array for use in shouldComponentUpdate

/* ADD CRYPTOBRIDGE TEST TO CHAIN CONFIG */
ChainConfig.networks.CryptoBridgeTest = {
    core_asset: "BTS",
    address_prefix: "BTS",
    chain_id: "2821abbb9923c830cf8300136c431674756270d9019f56c00e80b296e3afc079"
};

/*
* Electron does not support browserHistory, so we need to use hashHistory.
* The same is true for servers without configuration options, such as Github Pages
*/
const history = __HASH_HISTORY__ ? hashHistory : browserHistory;

const rootEl = document.getElementById("content");
const render = () => {
    ReactDOM.render(<Router history={history} routes={routes} />, rootEl);
};
render();
