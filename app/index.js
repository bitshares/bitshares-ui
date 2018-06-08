import React from "react";
import ReactDOM from "react-dom";
// import {BrowserRouter, HashRouter} from "react-router-dom";
/*
* Routes-dev is only needed for react hot reload, as this does not work with
* the async routes defined in Routes.jsx. Any changes to the routes must be kept
* synchronized between the two files
*/
import AppInit from "./AppInit";

// require("./components/Utility/Prototypes"); // Adds a .equals method to Array for use in shouldComponentUpdate

/*
* Electron does not support browserHistory, so we need to use hashHistory.
* The same is true for servers without configuration options, such as Github Pages
*/
// const Router = __HASH_HISTORY__ ? HashRouter : BrowserRouter;

const rootEl = document.getElementById("content");
const render = () => {
    ReactDOM.render(<AppInit />, rootEl);
};
render();
