import React from "react";
import counterpart from "counterpart";
import ClipboardButton from "react-clipboard.js";
import Icon from "../Icon/Icon";
import {Tooltip} from "bitshares-ui-style-guide";

const CopyButton = ({
    className = "button",
    text = "",
    tip = "tooltip.copy_tip",
    dataPlace = "right",
    buttonIcon = "clippy",
    buttonText = "",
    useDiv = true
}) => {
    const button = (
        <ClipboardButton data-clipboard-text={text} className={className}>
            {!buttonText ? (
                <Icon name={buttonIcon} title={"icons.clippy.copy"} />
            ) : (
                buttonText
            )}
        </ClipboardButton>
    );
    return (
        <Tooltip placement={dataPlace} title={counterpart.translate(tip)}>
            {useDiv ? <div>{button}</div> : <span>{button}</span>}
        </Tooltip>
    );
};

export default CopyButton;
