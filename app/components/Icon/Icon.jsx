// look for more icons here https://linearicons.com/free or here http://hawcons.com/preview/

import React from "react";
import counterpart from "counterpart";

let icons = [
    "accounts",
    "adjust",
    "assets",
    "b-logo",
    "blocks",
    "checkmark-circle",
    "checkmark",
    "chevron-down",
    "clippy",
    "clock",
    "cog",
    "cogs",
    "committee_members",
    "connected",
    "connect",
    "cross-circle",
    "dashboard",
    "database",
    "deposit",
    "disconnected",
    "dollar-green",
    "dollar",
    "download",
    "excel",
    "eye",
    "eye-striked",
    "fees",
    "fi-star",
    "folder",
    "gift",
    "hamburger-x",
    "hamburger",
    "hourglass",
    "key",
    "layers",
    "link",
    "list",
    "locked",
    "markets",
    "menu",
    "minus-circle",
    "news",
    "piggy",
    "plus-circle",
    "power",
    "proposals",
    "question-circle",
    "search",
    "server",
    "settle",
    "share",
    "shuffle",
    "text",
    "thumb-tack",
    "thumb-untack",
    "thumbs-up",
    "times",
    "trade",
    "transfer",
    "trash",
    "unlocked",
    "user",
    "users",
    "wand",
    "warning",
    "withdraw",
    "witnesses",
    "workers"
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
    name: React.PropTypes.string.isRequired,
    title: React.PropTypes.string,
    size: React.PropTypes.oneOf(["1x", "1_5x", "2x", "3x", "4x", "5x", "10x"]),
    inverse: React.PropTypes.bool,
    className: React.PropTypes.string
};

Icon.defaultProps = {
    title: null
};

export default Icon;
