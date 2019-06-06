import React from "react";
import PropTypes from "prop-types";

export class DecimalChecker extends React.Component {
    static propTypes = {
        allowNaN: PropTypes.bool
    };

    static defaultProps = {
        allowNaN: false
    };

    getNumericEventValue(e) {
        var input = null;
        if (e.target.value == "" || e.target.value == null) {
            return "";
        } else if (parseFloat(e.target.value) == e.target.value) {
            input = e.target.value.trim();
        } else {
            input =
                parseFloat(e.target.value.trim().replace(/[^\d.-]/g, "")) || 0;
        }
        return input;
    }

    onPaste(e) {
        let allowNaN = this.props.allowNaN;
        var pasteValue = e.clipboardData.getData("text");
        var decimal = pasteValue.match(/\./g);
        var decimalCount = decimal ? decimal.length : 0;

        if (decimalCount > 1) e.preventDefault();
        if (!allowNaN && parseFloat(pasteValue) != pasteValue)
            e.preventDefault();
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
