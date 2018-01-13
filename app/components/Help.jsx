import React from "react";
import HelpContent from "./Utility/HelpContent";
import {pairs} from "lodash";

class Help extends React.Component {

    render() {
        let path = pairs(this.props.params).map(p => p[1]).join("/");
        return (
            <div className="grid-block page-layout help-content-layout">
                <div className="show-for-medium grid-block medium-3 left-column">
                    <div className="grid-content help-toc">
                        <HelpContent path="toc"/>
                    </div>
                </div>
                <div className="grid-block small-12 medium-9 main-content">
                    <div className="grid-content">
                        <HelpContent path={path || "index"}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default Help;
