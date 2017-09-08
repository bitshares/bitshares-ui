import React from "react";

class LoadingIndicator extends React.Component {

    constructor(props) {
        super(props);
        this.state = {progress: 0};
    }

    render() {
        switch (this.props.type) {
            case "three-bounce":
                return (
                    <div className="three-bounce">
                        <div className="bounce1"></div>
                        <div className="bounce2"></div>
                        <div className="bounce3"></div>
                    </div>
                );
                break;
            case "circle":
                return  (
                    <div className="circle-wrapper">
                        <div className="circle1 circle"></div>
                        <div className="circle2 circle"></div>
                        <div className="circle3 circle"></div>
                        <div className="circle4 circle"></div>
                        <div className="circle5 circle"></div>
                        <div className="circle6 circle"></div>
                        <div className="circle7 circle"></div>
                        <div className="circle8 circle"></div>
                        <div className="circle9 circle"></div>
                        <div className="circle10 circle"></div>
                        <div className="circle11 circle"></div>
                        <div className="circle12 circle"></div>
                    </div>
                );
                break;
            default:
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

}

export default LoadingIndicator;
