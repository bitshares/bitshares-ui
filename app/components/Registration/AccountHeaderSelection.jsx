import React from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";

export default function AccountHeaderSelection(props) {
    return (
        <div
            onClick={props.onChangeActive}
            className={`${
                props.forSmall
                    ? "hide-block-for-medium inactive-right-block"
                    : ""
            } small-horizontal small-only-block header-block`}
        >
            {!props.forSmall ? (
                <div>
                    {props.active ? (
                        <img
                            className="model-img"
                            src="model-type-images/account-active.svg"
                            alt="wallet"
                        />
                    ) : (
                        <img
                            className="model-img inactive-img"
                            src="model-type-images/account-inactive.svg"
                            alt="wallet"
                        />
                    )}
                </div>
            ) : null}
            <div className="small-only-text-left">
                <Translate
                    unsafe
                    content="registration.accountModelTitle"
                    component="p"
                    className={`selection-title ${
                        !props.active ? "inactive-title inactive-text" : ""
                    }`}
                />
                <Translate
                    content="wallet.password_model"
                    component="p"
                    className={`choice-model choice-account ${
                        !props.active ? "inactive-text" : ""
                    }`}
                />
                {!props.forSmall ? (
                    <span
                        data-tip={
                            props.active
                                ? counterpart.translate(
                                      "tooltip.registration.accountModel"
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
            </div>
        </div>
    );
}

AccountHeaderSelection.propTypes = {
    active: PropTypes.bool.isRequired,
    forSmall: PropTypes.bool,
    onChangeActive: PropTypes.func
};

AccountHeaderSelection.defaultProps = {
    forSmall: false,
    onChangeActive: null
};
