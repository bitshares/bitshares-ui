import React from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import ReactTooltip from "react-tooltip";
import Icon from "../Icon/Icon";
import {Download} from "../Wallet/Backup";

class WalletRegistrationConfirm extends React.Component {
    static propTypes = {
        toggleConfirmed: PropTypes.func.isRequired,
        checkboxUploaded: PropTypes.bool.isRequired,
        checkboxRecover: PropTypes.bool.isRequired,
        checkboxRemember: PropTypes.bool.isRequired,
        history: PropTypes.object.isRequired
    };

    onBackupDownload = () => {
        this.props.history.push("/");
    };

    static renderWarning() {
        return (
            <div className="attention-note">
                <Icon name="attention" size="1x" />
                <Translate
                    content="registration.attention"
                    className="attention-text"
                />
                <Translate component="p" content="registration.walletNote" />
            </div>
        );
    }

    renderTooltip() {
        return (
            <ReactTooltip
                id="wallet-confirm"
                className="custom-tooltip text-left"
                globalEventOff="click"
            >
                <div
                    className="tooltip-text"
                    onClick={e => e.stopPropagation()}
                >
                    <Translate content="tooltip.registration.whyBinFile" />
                    <span
                        onClick={() => ReactTooltip.hide()}
                        className="close-button cursor-pointer"
                    >
                        ×
                    </span>
                </div>
            </ReactTooltip>
        );
    }

    render() {
        return (
            <div className="text-left">
                <div className="confirm-checks">
                    <Translate
                        component="h3"
                        content="registration.createAccountTitle"
                    />
                    {WalletRegistrationConfirm.renderWarning()}
                </div>
                <div
                    className="checkbox-block"
                    onClick={() =>
                        this.props.toggleConfirmed("checkboxRemember")
                    }
                >
                    <span>
                        <Icon
                            className={`${
                                this.props.checkboxRemember
                                    ? "checkbox-active"
                                    : ""
                            } checkbox`}
                            name="checkmark"
                        />
                    </span>
                    <Translate
                        className="checkbox-text"
                        content="registration.checkboxRemember"
                    />
                </div>
                <div
                    className="checkbox-block"
                    onClick={() =>
                        this.props.toggleConfirmed("checkboxUploaded")
                    }
                >
                    <span>
                        <Icon
                            className={`${
                                this.props.checkboxUploaded
                                    ? "checkbox-active"
                                    : ""
                            } checkbox`}
                            name="checkmark"
                        />
                    </span>
                    <Translate
                        className="checkbox-text"
                        content="registration.checkboxUploaded"
                    />
                </div>
                <div
                    className="checkbox-block"
                    onClick={() =>
                        this.props.toggleConfirmed("checkboxRecover")
                    }
                >
                    <span>
                        <Icon
                            className={`${
                                this.props.checkboxRecover
                                    ? "checkbox-active"
                                    : ""
                            } checkbox`}
                            name="checkmark"
                        />
                    </span>
                    <Translate
                        className="checkbox-text"
                        content="registration.checkboxRecover"
                    />
                </div>
                <Download
                    confirmation
                    checkboxActive={
                        this.props.checkboxUploaded &&
                        this.props.checkboxRemember &&
                        this.props.checkboxRecover
                    }
                    downloadCb={this.onBackupDownload}
                />
                <Translate
                    component="p"
                    className="cursor-pointer why-bin-file checkbox-text"
                    content="registration.whyBinFile"
                    data-for="wallet-confirm"
                    data-tip
                    data-event="click"
                    data-place="bottom"
                    data-effect="solid"
                />
                {this.renderTooltip()}
            </div>
        );
    }
}

export default WalletRegistrationConfirm;
