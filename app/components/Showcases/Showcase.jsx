import React, {Component} from "react";
import PropTypes from "prop-types";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import {Tooltip} from "bitshares-ui-style-guide";

export default class Showcase extends Component {
    static propTypes = {
        target: PropTypes.func.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
        comingSoon: PropTypes.bool
    };

    static defaultProps = {
        disabled: false
    };

    constructor() {
        super();
    }

    render() {
        if (!!this.props.disabled || !!this.props.comingSoon) {
            return (
                <Tooltip
                    title={
                        typeof this.props.disabled == "string"
                            ? this.props.disabled
                            : "Coming soon"
                    }
                >
                    <div
                        className="showcases-grid--wrapper--item--wrapper--disabled disabled"
                        onClick={() => {}}
                        tabIndex={"0"}
                    >
                        <h2 className={"no-margin"}>
                            {!!this.props.comingSoon && (
                                <Icon
                                    style={{float: "right"}}
                                    name={"coming_soon"}
                                    size={"4x"}
                                />
                            )}
                            <Translate content={this.props.title} />
                        </h2>
                        <div
                            className={
                                "showcases-grid--wrapper--item--wrapper--content disabled"
                            }
                        >
                            <Icon name={this.props.icon} size={"5x"} />
                            <span
                                className={
                                    "padding showcases-grid--wrapper--item--wrapper--content--description disabled"
                                }
                            >
                                <Translate content={this.props.description} />
                            </span>
                        </div>
                    </div>
                </Tooltip>
            );
        } else {
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
}
