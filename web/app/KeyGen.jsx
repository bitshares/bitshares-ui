import React from "react";
import Router from "react-router";

const { Route, RouteHandler, DefaultRoute } = Router;

import KeyGenComponent from "./components/BrainKey/KeyGenComponent";

require("./assets/loader");

class KeyGen  {

    constructor(props) {
    }

    componentDidMount() {
    }

    componentWillUpdate(nextProps, nextState) {
    }

    render() {
        return (
            <KeyGenComponent/>
        )
    }
}

let routes = (
    <Route handler={KeyGen}>
        <Route name="keygen" path="keygen" handler={KeyGenComponent}/>
        <DefaultRoute handler={KeyGenComponent}/>
    </Route>
);


Router.run(routes, function (Handler) {
    React.render(<Handler/>, document.getElementById("content"));
});
