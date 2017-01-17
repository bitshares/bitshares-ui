import React from "react";
import ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";

/*
* Routes-dev is only needed for react hot reload, as this does not work with
* the async routes defined in Routes.jsx. Any changes to the routes must be kept
* synchronized between the two files
*/
import Routes from "./Routes-dev";

require("./components/Utility/Prototypes"); // Adds a .equals method to Array for use in shouldComponentUpdate

const rootEl = document.getElementById("content");
const render = () => {
    ReactDOM.render(
        <AppContainer>
            <Routes />
        </AppContainer>,
        rootEl
    );
};
render();

if (module.hot) {
    module.hot.accept("./Routes-dev.jsx", () => {
        const NextApp = require("./Routes-dev").default;
        ReactDOM.render(
          <AppContainer>
            <NextApp />
          </AppContainer>,
          document.getElementById("content"),
        );
    });
}
