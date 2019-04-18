import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "./FormattedAsset";
import FloatingDropdown from "./FloatingDropdown";
import Immutable from "immutable";
import counterpart from "counterpart";
import AssetWrapper from "./AssetWrapper";
import utils from "common/utils";
import PropTypes from "prop-types";

class PeriodSelector extends React.Component {
    static propTypes = {
        label: PropTypes.string, // a translation key for the label
        placeholder: PropTypes.string,
        onChange: PropTypes.func,
        tabIndex: PropTypes.number,
        error: PropTypes.string,
        scroll_length: PropTypes.number
    };

    static defaultProps = {
        disabled: false,
        tabIndex: 0
    };

    getNumericEventValue(e) {
        var input = null;
        if (
            e.target.value == "" ||
            e.target.value == null ||
            e.target.value < 0
        ) {
            return "";
        } else if (e.target.value === 0) {
            return 0;
        } else if (parseFloat(e.target.value) == e.target.value) {
            input = e.target.value.trim();
        } else {
            input =
                parseFloat(e.target.value.trim().replace(/[^\d.-]/g, "")) || 0;
        }
        return input;
    }

    onInputChange = e => {
        const {onChange, periodType} = this.props;
        if (onChange) {
            onChange({
                amount: this.getNumericEventValue(e),
                type: periodType
            });
        }
    };

    onTypeChange = type => {
        const {onChange, inputValue} = this.props;
        if (onChange) {
            onChange({
                amount: inputValue,
                type: type
            });
        }
    };

    render() {
        const {
            inputValue,
            values,
            entries,
            periodType,
            tabIndex,
            placeholder,
            disabled,
            scroll_length
        } = this.props;

        return (
            <div className="amount-selector" style={this.props.style}>
                <Translate
                    className="left-label"
                    component="label"
                    content={this.props.label}
                />
                <div className="inline-label input-wrapper">
                    <span className="input-addon-before">Each</span>
                    <input
                        disabled={disabled}
                        type="number"
                        value={inputValue || ""}
                        placeholder={placeholder}
                        onChange={this.onInputChange}
                        tabIndex={tabIndex}
                        style={{paddingLeft: "70px"}}
                    />

                    <div className="form-label select floating-dropdown">
                        <FloatingDropdown
                            entries={entries}
                            values={values}
                            value={periodType && periodType.name}
                            onChange={this.onTypeChange}
                            scroll_length={scroll_length}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default PeriodSelector;
