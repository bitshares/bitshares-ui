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
                className="padding"
                style={{
                    maxWidth: "400px",
                    minWidth: "320px"
                }}
            >
                <div
                    style={{
                        backgroundColor: "gray",
                        borderRadius: "10px",
                        cursor: "pointer"
                    }}
                >
                    <Translate
                        content={this.props.title}
                        className={"padding"}
                        component={"h2"}
                    />
                    <div
                        style={{
                            display: "flex"
                        }}
                        className={"padding"}
                    >
                        <Icon name={this.props.icon} size={"5x"} />
                        <span className={"padding"}>
                            <Translate content={this.props.description} />
                        </span>
                    </div>
                </div>
            </div>
        );
    }
}
