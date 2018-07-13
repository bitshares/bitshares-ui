import React from "react";
import ReactDOM from "react-dom";
import AppInit from "./AppInit";
if (__PERFORMANCE_DEVTOOL__) {
    const {registerObserver} = require("react-perf-devtool");
    registerObserver();
}

const rootEl = document.getElementById("content");
const render = () => {
    ReactDOM.render(<AppInit />, rootEl);
};
render();
