import React from "react";
import { RouteHandler } from "react-router";
import HelpContent from "./components/Utility/HelpContent";
import _ from "lodash";

class Help extends React.Component {

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    }

    render() {
        let path = _.pairs(this.props.params).map(p => p[1]).join("/");
        return <div>
            <HelpContent path={path || "index"}/>
        </div>;
    }
}

export default Help;
