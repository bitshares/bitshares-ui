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
        color: '#50D2C2', //blue
        border: 'solid 2px',
        borderColor: '#444 #444 #666 #666', // T R B L
        borderRadius: '8px 8px 8px 8px',
        backgroundColor: '#333',

        headerTextAlign: 'center',
        headerColor: '#FCAB53', //orange
        headerBackgroundColor: '#3C3C3C',

        footerTextAlign: 'center',
        footerColor: '#FCAB53', //orange
        footerBackgroundColor: '#3C3C3C',
    };


    constructor(props) {
        super(props);


        this.style = {
            margin: props.margin,
            padding: 0, //props.padding,
            color: props.color,
            backgroundColor: props.backgroundColor,
            border: props.border,
            borderColor: props.borderColor,
            borderRadius: props.borderRadius,
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
        };
        this.footerTextStyle = {
            color: props.footerColor,
        };
    }


    render3() {
        return (
            <div style={this.style}>
                {(this.props.header) ? (<h4 style={this.headerStyle}>{this.props.header}<br/></h4>) : ''}
                {this.props.children}
                {(this.props.footer) ? (<h4 style={this.footerStyle}>{this.props.footer}</h4>) : ''}
            </div>
        );
    }

    render() {
        return (
            <div style={this.style}>

                {(this.props.header) ? (
                    <div style={this.headerStyle}>
                        <h4 style={this.headerTextStyle}>{this.props.header}</h4>
                    </div>
                ) : ''}

                <div style={this.bodyStyle}>
                    {this.props.children}
                </div>

                {(this.props.footer) ? (
                    <div style={this.footerStyle}>
                        <h4 style={this.footerTextStyle}>{this.props.footer}</h4>
                    </div>
                ) : ''}

            </div>
        );
    }
}

export default Box;
