import React from "react";
import PropTypes from "prop-types";
import {Input, Icon} from "bitshares-ui-style-guide";
import counterpart from "counterpart";

export default function SearchInput({
    onChange,
    value,
    placeholder,
    maxLength,
    style,
    className,
    name,
    autoComplete,
    onClear,
    type,
    ...other
}) {
    if (onClear == undefined) {
        // if onClear=null, then it won't be rendered
        onClear = () => {
            onChange({
                target: {value: ""}
            });
        };
    }
    return (
        <Input
            autoComplete={autoComplete}
            style={style}
            type={type}
            className={className + " search-input"}
            placeholder={placeholder}
            maxLength={maxLength}
            name={name}
            value={value}
            onChange={onChange}
            addonAfter={<Icon type="search" />}
            suffix={
                onClear ? (
                    <Icon
                        onClick={onClear}
                        type="close"
                        // always include DOM the icon, otherwise user looses focus when it appears and input resizes
                        className={value ? "cursor-pointer" : "hide"}
                    />
                ) : null
            }
            {...other}
        />
    );
}

SearchInput.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    type: PropTypes.string,
    name: PropTypes.string,
    autoComplete: PropTypes.string,
    maxLength: PropTypes.number,
    onClear: PropTypes.func
};

SearchInput.defaultProps = {
    placeholder: counterpart.translate("exchange.filter"),
    style: {},
    className: "",
    type: "text",
    name: "focus",
    autoComplete: "off",
    maxLength: 16,
    onClear: undefined
};
