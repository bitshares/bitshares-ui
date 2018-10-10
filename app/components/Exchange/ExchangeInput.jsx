import React from "react";
import {Input} from "bitshares-ui-style-guide";
import {DecimalChecker} from "../Utility/DecimalChecker";

class ExchangeInput extends DecimalChecker {
    constructor() {
        super();
    }

    componentWillReceiveProps(np) {
        if (this.props.value && !np.value) {
            this.refs.input.value = "";
        }
    }

    render() {
        return (
            <input
                ref="input"
                type="text"
                {...this.props}
                onPaste={this.props.onPaste || this.onPaste.bind(this)}
                onKeyPress={this.onKeyPress.bind(this)}
            />
        );
    }
}

export default ExchangeInput;
