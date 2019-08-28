import React from "react";
import cnames from "classnames";

class DividerMenuItem extends React.Component {
    render() {
        const {additionalClassName, hidden} = this.props;

        return hidden ? null : (
            <li className={cnames("divider", additionalClassName)} />
        );
    }
}

export default DividerMenuItem;
