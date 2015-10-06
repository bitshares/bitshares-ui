import React from "react";
import { RouteHandler } from "react-router";
import HelpContent from "./Utility/HelpContent";
import _ from "lodash";

class Help extends React.Component {

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    }

    render() {
        let path = _.pairs(this.props.params).map(p => p[1]).join("/");
        return (
            <div className="grid-block page-layout">
                <div className="show-for-medium grid-block medium-2 left-column">
                    <div className="grid-content">
                        <HelpContent path="toc"/>
                    </div>
                </div>
                <div className="grid-block small-12 medium-10 main-content">
                    <div className="grid-content">
                        <HelpContent path={path || "index"}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default Help;
