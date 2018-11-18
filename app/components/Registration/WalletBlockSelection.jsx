import React from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";

export default function WalletBlockSelection(props) {
    return (
        <div
            className="wallet-block-registration"
            onClick={props.onChangeActive}
        >
            <div className="overflow-bg-block show-for-small-only">
                <span className="content" />
            </div>
            <Translate
                content="registration.securityKey"
                component="p"
                className={`model-option security-key ${
                    !props.active ? "inactive-text" : ""
                }`}
            />
            <Translate
                content="registration.securityWalletModel"
                component="p"
                className={`model-option-value option-border ${
                    !props.active ? "inactive-text" : ""
                }`}
            />
            <Translate
                content="registration.loginByKey"
                component="p"
                className={`model-option ${
                    !props.active ? "inactive-text" : ""
                }`}
            />
            <Translate
                content="registration.walletLoginByValue"
                component="p"
                className={`model-option-value option-border ${
                    !props.active ? "inactive-text" : ""
                }`}
            />
            <Translate
                content="registration.backUpRestoreKey"
                component="p"
                className={`model-option ${
                    !props.active ? "inactive-text" : ""
                }`}
            />
            <Translate
                content="settings.yes"
                component="p"
                className={`model-option-value ${
                    !props.active ? "inactive-text" : ""
                }`}
            />

            {props.active ? (
                <Translate
                    className="button-primary"
                    onClick={props.onSelect}
                    content="registration.continue"
                />
            ) : (
                <Translate
                    className="button-secondary"
                    content="registration.select"
                />
            )}
        </div>
    );
}

WalletBlockSelection.propTypes = {
    active: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    onChangeActive: PropTypes.func.isRequired
};
