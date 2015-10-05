import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import LoadingIndicator from "../LoadingIndicator";
import Inspector from "react-json-inspector";
require("./../Blockchain/json-inspector.scss");

class Box extends React.Component {

    static propTypes = {
    };

    static defaultProps = {
        margin: '10px',
        padding: '10px',
        backgroundColor: '#3f3f3f',
        headerBackgroundColor: '#383838',
    };


    constructor(props) {
        super(props);


        this.style = {
            margin: props.margin,
            backgroundColor: props.backgroundColor,
            border: props.border,
        };

        this.bodyStyle = {
            margin: 0,
            padding: props.padding,
        };
        this.headerStyle = {
            margin: 0,
            padding: props.padding,
            backgroundColor: props.headerBackgroundColor,
            textAlign: props.headerTextAlign,
        };
        this.footerStyle = {
            margin: 0,
            padding: props.padding,
            backgroundColor: props.footerBackgroundColor,
            textAlign: props.footerTextAlign,
        };
        this.headerTextStyle = {
            color: props.headerColor,
            fontWeight: 'normal',
        };
        this.footerTextStyle = {
            color: props.footerColor,
            fontWeight: 'normal',
        };
    }


    render() {
        return (
            <div style={this.style}>

                {(this.props.header) ? (
                    <div style={this.headerStyle}>
                        <h4>{this.props.header}</h4>
                    </div>
                ) : ''}

                <div style={this.bodyStyle}>
                    {this.props.children}
                </div>

                {(this.props.footer) ? (
                    <div style={this.footerStyle}>
                        <h4>{this.props.footer}</h4>
                    </div>
                ) : ''}

            </div>
        );
    }
}

export default Box;
