import React from "react";
import Translate from "react-translate-component";

class Incognito extends React.Component {
    render() {
        const {props} = this;
        return (
            <div id="incognito">
                <div className="dismiss" onClick={props.onClickIgnore}>
                    &times;
                </div>
                <strong>
                    <Translate content="incognito.mode" />{" "}
                </strong>
                <Translate content="incognito.warning" />
            </div>
        );
    }
}

export default Incognito;
