import React from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";

export default function WalletHeaderSelection(props) {
    return (
        <div
            onClick={props.onChangeActive}
            className={`${
                props.forSmall
                    ? "hide-block-for-medium inactive-left-block"
                    : ""
            } small-horizontal small-only-block header-block`}
        >
            {!props.forSmall ? (
                <div>
                    {props.active ? (
                        <img
                            className="model-img"
                            src="model-type-images/flesh-active.svg"
                            alt="wallet"
                        />
                    ) : (
                        <img
                            className="model-img inactive-img"
                            src="model-type-images/flesh-inactive.svg"
                            alt="wallet"
                        />
                    )}
                </div>
            ) : null}
            <div className="small-only-text-left">
                <Translate
                    content="registration.walletModelTitle"
                    component="p"
                    className={`selection-title ${
                        !props.active ? "inactive-title inactive-text" : ""
                    }`}
                />
                <Translate
                    content="wallet.wallet_model"
                    className={`choice-model ${
                        !props.active ? "inactive-text" : ""
                    }`}
                />
                {!props.forSmall ? (
                    <span
                        data-tip={
                            props.active
                                ? counterpart.translate(
                                      "tooltip.registration.walletModel"
                                  )
                                : ""
                        }
                    >
                        <Icon
                            name="question-in-circle"
                            className="icon-14px question-icon"
                        />
                    </span>
                ) : null}
                <Translate
                    content="registration.recommended"
                    component="p"
                    className={`recommended ${
                        !props.active && !props.forSmall ? "inactive-text" : ""
                    }`}
                />
            </div>
        </div>
    );
}

WalletHeaderSelection.propTypes = {
    active: PropTypes.bool.isRequired,
    forSmall: PropTypes.bool,
    onChangeActive: PropTypes.func
};

WalletHeaderSelection.defaultProps = {
    forSmall: false,
    onChangeActive: null
};
