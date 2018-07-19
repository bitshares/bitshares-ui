// look for more icons here https://linearicons.com/free or here http://hawcons.com/preview/

import React from "react";
import counterpart from "counterpart";
import PropTypes from "prop-types";
import iconsMap from "../../assets/icons/icons-loader.js";

require("./icon.scss");

class Icon extends React.Component {
    shouldComponentUpdate(np) {
        return (
            np.className !== this.props.className ||
            np.name !== this.props.name ||
            np.title !== this.props.title ||
            np.size !== this.props.size
        );
    }

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
                        __html: iconsMap[this.props.name]
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
                        __html: iconsMap[this.props.name]
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
