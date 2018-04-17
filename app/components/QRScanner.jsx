import React from "react";
import BaseModal from "components/Modal/BaseModal";
import QrReader from "react-qr-reader";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";

class QRScanner extends React.Component {
    modalId = "qr_scanner_modal";

    state = {
        visible: false
    };

    static propTypes = {
        onSuccess: React.PropTypes.func,
        onError: React.PropTypes.func,
        label: React.PropTypes.string
    };

    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
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

    render() {
        const handleError = err => {
            if (typeof this.props.onError === "function")
                this.props.onError(err);
        };

        const handleScan = data => {
            if (data) {
                if (typeof this.props.onSuccess === "function")
                    this.props.onSuccess(data);

                this.handleClose();
            }
        };

        return (
            <div>
                <button className="button" onClick={this.handleClick}>
                    {this.props.label || "Scan QR Code"}
                </button>
                {(this.state.visible && (
                    <BaseModal
                        id={this.modalId}
                        overlay={true}
                        noLoggo={true}
                        onClose={this.handleClose}
                    >
                        <QrReader
                            delay={100}
                            onError={handleError}
                            onScan={handleScan}
                            style={{width: "100%", height: "100%"}}
                        />
                    </BaseModal>
                )) ||
                    null}
            </div>
        );
    }
}

export default QRScanner;
