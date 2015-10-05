// look for more icons here https://linearicons.com/free

import React from "react";

let icons = ["user", "trash", "chevron-down", "menu", "database", "search",
    "plus-circle", "question-circle", "cross-circle", "cog", "layers", "users", "wand", "b-logo",
    "accounts", "witnesses", "assets", "proposals", "blocks", "committee_members", "workers", "key",
    "checkmark-circle", "checkmark", "piggy"];

let icons_map = {};
for (let i of icons) icons_map[i] = require(`./${i}.svg`);

require("./icon.scss");

class Icon extends React.Component {
    render() {
        let classes = "icon";
        if(this.props.size) {
            classes += " icon-" + this.props.size;
        }
        if(this.props.className) {
            classes += " " + this.props.className;
        }
        return <span className={classes} dangerouslySetInnerHTML={{__html: icons_map[this.props.name]}}/>;
    }
}

Icon.propTypes = {
    name: React.PropTypes.string.isRequired,
    size: React.PropTypes.oneOf(["1x", "2x", "3x", "4x", "5x", "10x"]),
    inverse: React.PropTypes.bool,
    className: React.PropTypes.string
};

export default Icon;
