import React from "react";
import ReactDOM from "react-dom";
import AppInit from "./AppInit";

const rootEl = document.getElementById("content");
const render = () => {
    ReactDOM.render(<AppInit />, rootEl);
};
render();
