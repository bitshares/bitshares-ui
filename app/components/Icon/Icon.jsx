// look for more icons here https://linearicons.com/free or here http://hawcons.com/preview/

import React from "react";
import counterpart from "counterpart";
import PropTypes from "prop-types";

let icons = [
    "photo-camera",
    "adjust",
    "assets",
    "checkmark-circle",
    "chevron-down",
    "clippy",
    "clock",
    "cog",
    "cogs",
    "connected",
    "connect",
    "cross-circle",
    "dashboard",
    "deposit",
    "disconnected",
    "dollar-green",
    "dollar",
    "download",
    "excel",
    "eye",
    "eye-striked",
    "fi-star",
    "folder",
    "globe",
    "hamburger-x",
    "hamburger",
    "hourglass",
    "key",
    "list",
    "locked",
    "moon",
    "minus-circle",
    "news",
    "plus-circle",
    "power",
    "question-circle",
    "server",
    "settle",
    "share",
    "shuffle",
    "sun",
    "text",
    "thumb-tack",
    "thumb-untack",
    "thumbs-up",
    "times",
    "trade",
    "transfer",
    "unlocked",
    "user",
    "warning",
    "withdraw",
    "filter",
    "info-circle-o",
    "zoom"
];

let icons_map = {};
for (let i of icons) icons_map[i] = require(`./${i}.svg`);

require("./icon.scss");

class Icon extends React.Component {
    render() {
        let classes = "icon " + this.props.name;
        if (this.props.size) {
            classes += " icon-" + this.props.size;
        }
        if (this.props.className) {
            classes += " " + this.props.className;
        }
        if (this.props.title != null) {
            let title = this.props.title;
            if (typeof title === "string" && title.indexOf(".") > 0) {
                title = counterpart.translate(title);
            }
            return (
                <span
                    title={title}
                    className={classes}
                    style={this.props.style || {}}
                    dangerouslySetInnerHTML={{
                        __html: icons_map[this.props.name]
                    }}
                    onClick={this.props.onClick}
                />
            );
        } else {
            return (
                <span
                    className={classes}
                    style={this.props.style || {}}
                    dangerouslySetInnerHTML={{
                        __html: icons_map[this.props.name]
                    }}
                    onClick={this.props.onClick}
                />
            );
        }
    }
}

Icon.propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string,
    size: PropTypes.oneOf(["1x", "1_5x", "2x", "3x", "4x", "5x", "10x"]),
    inverse: PropTypes.bool,
    className: PropTypes.string
};

Icon.defaultProps = {
    title: null
};

export default Icon;
