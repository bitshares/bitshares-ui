import React from "react";
import counterpart from "counterpart";
import ClipboardButton from "react-clipboard.js";
import Icon from "../Icon/Icon";

const CopyButton = ({
    className = "button",
    text = "",
    tip = "tooltip.copy_tip",
    dataPlace = "right",
    buttonIcon = "clippy",
    buttonText = ""
}) => {
    return (
        <ClipboardButton
            data-clipboard-text={text}
            className={className}
            data-place={dataPlace}
            data-tip={counterpart.translate(tip)}
        >
            {!buttonText ? (
                <Icon name={buttonIcon} title={"icons.clippy.copy"} />
            ) : (
                buttonText
            )}
        </ClipboardButton>
    );
};

export default CopyButton;
