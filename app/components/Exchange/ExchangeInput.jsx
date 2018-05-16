import React from "react";
import utils from "common/utils";

export class DecimalChecker extends React.Component {
    onPaste(e) {
        var pasteValue = e.clipboardData.getData("text");

        var decimal = pasteValue.match(/\./g);
        var decimalCount = decimal ? decimal.length : 0;
        if (decimalCount > 1) e.preventDefault();
        if (parseFloat(pasteValue) != pasteValue) e.preventDefault();
    }

    onKeyPress(e) {
        if (!e.nativeEvent.ctrlKey) {
            // allow copy-paste

            if (e.key === "." && e.target.value === "") e.target.value = "0";
            var nextValue = e.target.value + e.key;
            var decimal = nextValue.match(/\./g);
            var decimalCount = decimal ? decimal.length : 0;
            if (e.key === "." && decimalCount > 1) e.preventDefault();
            if (parseFloat(nextValue) != nextValue) e.preventDefault();

            if (this.props.onKeyPress) this.props.onKeyPress(e);
        }
    }
}

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
        let {value} = this.props;

        if (typeof value === "undefined") {
            value = "";
        } else {
            value = utils.toFixedString(value);
        }

        const props = Object.assign({}, this.props, {value});

        return (
            <input
                ref="input"
                type="text"
                {...props}
                onPaste={this.onPaste.bind(this)}
                onKeyPress={this.onKeyPress.bind(this)}
            />
        );
    }
}

export default ExchangeInput;
