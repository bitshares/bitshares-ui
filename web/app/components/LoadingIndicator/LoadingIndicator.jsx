import React from "react";
require("./loading-indicator.scss");

class LoadingIndicator extends React.Component {

    constructor(props) {
        super(props);
        this.state = {progress: 0};
    }

    render() {
        //console.log("[LoadingIndicator.jsx:11] ----- render ----->", this.state);
        var classes = "loading-overlay";
        if(this.progress > 0) { classes += " with-progress"; }
        return (
            <div className={classes}>
                <div className="loading-panel">
                    <div className="spinner">
                        <div className="bounce1"></div>
                        <div className="bounce2"></div>
                        <div className="bounce3"></div>
                    </div>
                    <div className="progress-indicator"><span>{this.state.progress}</span></div>
                </div>
            </div>
        );
    }

}

export default LoadingIndicator;
