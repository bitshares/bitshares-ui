import React from "react";
import Translate from "react-translate-component";

class SubmenuItem extends React.Component {
    render() {
        const {target, text, hidden, icon} = this.props;

        return hidden ? null : (
            <li onClick={target}>
                <Translate
                    content={text}
                    component="div"
                    className="table-cell"
                />
            </li>
        );
    }
}

export default SubmenuItem;
