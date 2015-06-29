// look for more icons here https://linearicons.com/free

import React from "react";

let icons = ["user", "trash", "chevron-down", "menu", "database", "search",
    "plus-circle", "question-circle", "cross-circle", "cog", "layers", "users", "wand", "b-logo",
    "key"];
let icons_map = {};
for (let i of icons) icons_map[i] = require(`./${i}.svg`);

require("./icon.scss");

class Icon extends React.Component {
    render() {
        let classes = "icon";
        let style;
        if(this.props.size) {
            classes += " icon-" + this.props.size;
        }
        //if(this.props.fillClass) {
        //    classes += " " + this.props.fillClass;
        //}
        return <span style={style} className={classes} dangerouslySetInnerHTML={{__html: icons_map[this.props.name]}}/>;
    }
}

Icon.propTypes = {
    name: React.PropTypes.string.isRequired,
    size: React.PropTypes.oneOf(["2x", "3x", "4x", "5x", "10x"]),
    inverse: React.PropTypes.bool,
    //fillClass: React.PropTypes.string
};

export default Icon;
