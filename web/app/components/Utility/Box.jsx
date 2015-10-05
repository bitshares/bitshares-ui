import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import LoadingIndicator from "../LoadingIndicator";
require("./Box.scss");

class Box extends React.Component {

/*
    static propTypes = {
    };

    static defaultProps = {
    };

    constructor(props) {
        super(props);
    }
*/


    render() {
        return (
            <div className="Box">

                {(this.props.header) ? (
                    <div className="BoxHeader">
                        <h4>{this.props.header}</h4>
                    </div>
                ) : ''}

                <div className="BoxBody">
                    {this.props.children}
                </div>

                {(this.props.footer) ? (
                    <div className="BoxFooter">
                        <h4>{this.props.footer}</h4>
                    </div>
                ) : ''}

            </div>
        );
    }
}

export default Box;
