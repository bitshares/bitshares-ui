// look for more icons here https://linearicons.com/free

import React from "react";

let icons = ["user", "trash", "chevron-down", "menu", "plus-circle", "cog"];
let icons_map = {};
for (let i of icons) icons_map[i] = require(`./${i}.svg`);

require("./icon.scss");

class Icon extends React.Component {
    render() {
        let classes = "icon";
        if(this.props.size) classes += " icon-"+this.props.size;
        return <span className={classes} dangerouslySetInnerHTML={{__html: icons_map[this.props.name]}}/>;
    }
}

Icon.propTypes = {
    name: React.PropTypes.string.isRequired,
    size: React.PropTypes.oneOf(['2x', '3x', '4x', '5x']),
    inverse: React.PropTypes.bool
};

export default Icon;
