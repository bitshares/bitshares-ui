import React, {Component} from "react";
import PropTypes from "prop-types";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";

export default class Showcase extends Component {
    static propTypes = {
        target: PropTypes.func.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired
    };

    constructor() {
        super();
    }

    render() {
        return (
            <div
                className="showcases-grid--wrapper--item--wrapper"
                onClick={this.props.target}
                tabIndex={"0"}
            >
                <Translate
                    content={this.props.title}
                    className={"no-margin"}
                    component={"h2"}
                />
                <div
                    className={
                        "showcases-grid--wrapper--item--wrapper--content"
                    }
                >
                    <Icon name={this.props.icon} size={"5x"} />
                    <span
                        className={
                            "padding showcases-grid--wrapper--item--wrapper--content--description"
                        }
                    >
                        <Translate content={this.props.description} />
                    </span>
                </div>
            </div>
        );
    }
}
