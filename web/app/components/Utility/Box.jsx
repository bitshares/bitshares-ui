import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import LoadingIndicator from "../LoadingIndicator";
import Accordion from 'react-foundation-apps/src/accordion';

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

    renderOriginal() {
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

    renderAccordian() {
        var title = this.props.header ? this.props.header : '';
        return (
            <div className="Box">

                <Accordion multiOpen="true">
                    <Accordion.Item title={title}>
                        <div className="BoxBody">
                            {this.props.children}
                        </div>
                    </Accordion.Item>
                </Accordion>

            </div>
        );
    }

    render() {
        return (
            this.props.accordian ? this.renderAccordian() : this.renderOriginal()
        );
    }


}

export default Box;
