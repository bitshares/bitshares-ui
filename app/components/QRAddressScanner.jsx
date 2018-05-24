import React from "react";
import BaseModal from "components/Modal/BaseModal";
import QrReader from "react-qr-reader";
import Icon from "./Icon/Icon";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import counterpart from "counterpart";
import PropTypes from "prop-types";

class QRScanner extends React.Component {
    modalId = "qr_scanner_modal";

    state = {
        visible: false
    };

    static propTypes = {
        onSuccess: PropTypes.func,
        onError: PropTypes.func,
        label: PropTypes.string
    };

    constructor(props) {
        super(props);

        this.retry = this.retry.bind(this);
        this.submit = this.submit.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onScanSuccess = this.onScanSuccess.bind(this);
    }

    handleClick() {
        this.setState(
            {
                visible: true
            },
            () => {
                ZfApi.publish(this.modalId, "open");
            }
        );
    }

    handleClose() {
        this.setState({
            visible: false
        });
    }

    isBitcoinAddress(data) {
        return /bitcoin:([a-zA-Z0-9]+)/.test(data);
    }

    parseBitcoinAddress(str) {
        const address = str.match(/bitcoin:([a-zA-Z0-9]+)/);
        const amount = str.match(/amount=([0-9\.]+)/);
        return {
            address: (address && address[1]) || null,
            amount: (amount && amount[1]) || null
        };
    }

    onScanSuccess(data) {
        if (this.isBitcoinAddress(data)) {
            let result = this.parseBitcoinAddress(data);
            if (result) {
                this.setState({
                    address: result.address,
                    amount: result.amount
                });
            }
        } else {
            this.setState({
                address: data,
                amount: null
            });
        }
    }

    retry() {
        this.setState({
            address: null,
            amount: null
        });
    }

    submit() {
        this.handleClose();
        if (typeof this.props.onSuccess === "function") {
            this.props.onSuccess({
                address: this.state.address,
                amount: this.state.amount
            });
        }
    }

    render() {
        const handleError = err => {
            if (typeof this.props.onError === "function")
                this.props.onError(err);
        };

        const handleScan = data => {
            if (data) {
                this.onScanSuccess(data);
            }
        };

        return (
            <div className="qr-address-scanner">
                <button
                    className="qr-address-scanner-btn"
                    onClick={this.handleClick}
                >
                    <Icon name="photo-camera" />
                </button>
                {(this.state.visible && (
                    <BaseModal
                        className="qr-address-scanner-modal"
                        modalHeader="global.scan_qr_code"
                        id={this.modalId}
                        overlay={true}
                        noLoggo={true}
                        onClose={this.handleClose}
                    >
                        <QrReader
                            delay={100}
                            onError={handleError}
                            onScan={handleScan}
                            style={{
                                width: "calc(100% - 48px)",
                                margin: "0 24px"
                            }}
                        />

                        {this.state.address && (
                            <div>
                                <div className="qr-address-scanner-status">
                                    <div className="qr-address-scanner-status-title">
                                        {counterpart.translate(
                                            "qr_address_scanner.address_found"
                                        )}:
                                    </div>
                                    <div className="qr-address-scanner-status-address">
                                        {this.state.address}
                                    </div>

                                    {this.state.amount && (
                                        <div className="qr-address-scanner-status-title">
                                            {counterpart.translate(
                                                "qr_address_scanner.amount"
                                            )}
                                        </div>
                                    )}
                                    {this.state.amount && (
                                        <div className="qr-address-scanner-status-amount">
                                            {this.state.amount}
                                        </div>
                                    )}
                                </div>

                                <div className="qr-address-scanner-divider" />

                                <div className="qr-address-scanner-actions">
                                    <button
                                        className="button"
                                        onClick={this.submit}
                                    >
                                        {counterpart.translate(
                                            "qr_address_scanner.use_address"
                                        )}
                                    </button>
                                    <button
                                        className="button hollow primary"
                                        onClick={this.retry}
                                    >
                                        {counterpart.translate(
                                            "qr_address_scanner.retry"
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </BaseModal>
                )) ||
                    null}
            </div>
        );
    }
}

export default QRScanner;
