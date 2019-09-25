import React from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import QRCode from "qrcode.react";
import {Aes} from "tuscjs";
import {Modal, Button} from "bitshares-ui-style-guide";

class QrcodeModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this._getInitialState();
        this.onPasswordEnter = this.onPasswordEnter.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    _getInitialState() {
        return {
            isShowQrcode: false,
            keyString: null
        };
    }

    onCancel() {
        this.props.hideModal();
        this.onClose();
    }

    onClose() {
        if (this.refs.password_input) this.refs.password_input.value = "";
        this.setState(this._getInitialState());
    }

    onPasswordEnter(e) {
        e.preventDefault();
        let pwd = this.refs.password_input.value;
        let key = this.props.keyValue;
        if (pwd != null && pwd != "") {
            if (key !== undefined && key != null && key != "") {
                let pwd_aes = Aes.fromSeed(pwd);
                let qrkey = pwd_aes.encryptToHex(key);
                this.setState({isShowQrcode: true, keyString: qrkey});
            }
        } else {
            //notify.error("You'd better enter a password to encrypt the qr code");
            this.setState({isShowQrcode: true, keyString: key});
        }
    }

    onKeyDown(e) {
        if (e.keyCode === 13) this.onPasswordEnter(e);
    }

    render() {
        let pos = null;
        if (this.state.isShowQrcode) pos = {textAlign: "center"};

        const footer = [];

        if (!this.state.isShowQrcode) {
            footer.push(
                <Button
                    type="primary"
                    key="submit"
                    onClick={this.onPasswordEnter}
                >
                    {counterpart.translate("modal.ok")}
                </Button>
            );
        }

        footer.push(
            <Button key="cancel" onClick={this.onCancel}>
                {counterpart.translate("cancel")}
            </Button>
        );

        return (
            <Modal
                visible={this.props.visible}
                onCancel={this.onCancel}
                footer={footer}
            >
                <div className="text-center">
                    <div style={{margin: "1.5rem 0"}}>
                        <Translate
                            component="h4"
                            content="modal.qrcode.title"
                        />
                    </div>
                    <form
                        className="full-width"
                        style={{margin: "0 3.5rem"}}
                        onSubmit={this.onPasswordEnter}
                        noValidate
                    >
                        <div className="form-group">
                            {this.state.isShowQrcode ? (
                                <section style={pos}>
                                    <span
                                        style={{
                                            background: "#fff",
                                            padding: ".75rem",
                                            display: "inline-block"
                                        }}
                                    >
                                        <QRCode
                                            size={256}
                                            value={this.state.keyString}
                                        />
                                    </span>
                                </section>
                            ) : (
                                <section>
                                    <label className="left-label">
                                        <Translate
                                            unsafe
                                            content="modal.qrcode.input_message"
                                        />
                                    </label>
                                    <input
                                        name="password"
                                        type="text"
                                        onFocus={() => {
                                            this.refs.password_input.setAttribute(
                                                "type",
                                                "password"
                                            );
                                        }}
                                        ref="password_input"
                                        autoComplete="off"
                                        onKeyDown={this.onKeyDown}
                                    />
                                </section>
                            )}
                        </div>
                    </form>
                </div>
            </Modal>
        );
    }
}

QrcodeModal.propTypes = {
    modalId: PropTypes.string.isRequired,
    keyValue: PropTypes.string
};
QrcodeModal.defaultProps = {
    modalId: "qr_code_password_modal"
};
export default QrcodeModal;
