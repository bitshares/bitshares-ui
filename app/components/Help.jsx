import React from "react";
import HelpContent from "./Utility/HelpContent";
import {toPairs} from "lodash-es";

class Help extends React.Component {
    render() {
        let path = toPairs(this.props.match.params)
            .map(p => p[1])
            .join("/");

        return (
            <div className="grid-container page-layout help-content-layout">
                <div className="grid-block page-layout">
                    <div className="grid-block main-content wrap regular-padding">
                        <div className="grid-block medium-3">
                            <div className="grid-content help-toc responsive-list">
                                <HelpContent path="toc" />
                            </div>
                        </div>

                        <div className="grid-block medium-9">
                            <div className="grid-content main-content">
                                <HelpContent path={path || "index"} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Help;
