import React, {Component} from "react";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletDb from "stores/WalletDb";
import Translate from "react-translate-component";
import PrivateKeyStore from "stores/PrivateKeyStore";
import QrcodeModal from "./Modal/QrcodeModal";
import counterpart from "counterpart";
import PropTypes from "prop-types";
import {Modal, Button} from "bitshares-ui-style-guide";

export default class PrivateKeyView extends Component {
    static propTypes = {
        pubkey: PropTypes.string.isRequired
    };

    constructor() {
        super();
        this.state = this._getInitialState();

        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);

        this.showQrModal = this.showQrModal.bind(this);
        this.hideQrModal = this.hideQrModal.bind(this);

        this.onClose = this.onClose.bind(this);
    }

    _getInitialState() {
        return {
            isModalVisible: false,
            isQrModalVisible: false,
            wif: null
        };
    }

    reset() {
        this.setState(this._getInitialState());
    }

    hideModal() {
        this.setState({
            isModalVisible: false
        });
    }

    showModal() {
        this.setState({
            isModalVisible: true
        });
    }

    hideQrModal() {
        this.setState({
            isQrModalVisible: false
        });
    }

    showQrModal() {
        this.setState({
            isQrModalVisible: true
        });
    }

    render() {
        var modalId = "key_view_modal" + this.props.pubkey;
        var keys = PrivateKeyStore.getState().keys;

        var has_private = keys.has(this.props.pubkey);
        if (!has_private) return <span>{this.props.children}</span>;
        var key = keys.get(this.props.pubkey);

        const footer = [
            <Button key="cancel" onClick={this.onClose}>
                {counterpart.translate("transfer.close")}
            </Button>
        ];

        return (
            <span>
                <a onClick={this.onOpen.bind(this)}>{this.props.children}</a>
                <Modal
                    visible={this.state.isModalVisible}
                    title={counterpart.translate("account.perm.key_viewer")}
                    ref={modalId}
                    id={modalId}
                    onCancel={this.onClose}
                    footer={footer}
                >
                    <div className="grid-block vertical">
                        <div className="content-block">
                            <div className="grid-content">
                                <label>
                                    <Translate content="account.perm.public" />
                                </label>
                                {this.props.pubkey}
                            </div>
                            <br />

                            <div className="grid-block grid-content">
                                <label>
                                    <Translate content="account.perm.private" />
                                </label>
                                <div>
                                    {this.state.wif ? (
                                        <span>
                                            <p style={{fontWeight: 600}}>
                                                {this.state.wif}
                                            </p>
                                            <div className="button-group">
                                                <div
                                                    className="button"
                                                    onClick={this.onHide.bind(
                                                        this
                                                    )}
                                                >
                                                    hide
                                                </div>
                                                <div
                                                    className="clickable"
                                                    onClick={this.showQrModal}
                                                >
                                                    <img
                                                        style={{height: 50}}
                                                        src={require("assets/qr.png")}
                                                    />
                                                </div>
                                            </div>
                                        </span>
                                    ) : (
                                        <span>
                                            <div
                                                className="button"
                                                onClick={this.onShow.bind(this)}
                                            >
                                                <Translate content="account.perm.show" />
                                            </div>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <br />

                            <div className="grid-block grid-content">
                                <label>
                                    <Translate content="account.perm.brain" />
                                </label>
                                {key.brainkey_sequence == null
                                    ? "Non-deterministic"
                                    : key.brainkey_sequence}
                            </div>
                            <br />

                            {key.import_account_names &&
                            key.import_account_names.length ? (
                                <div className="grid-block grid-content">
                                    <label>
                                        <Translate content="account.perm.from" />
                                    </label>
                                    {key.import_account_names.join(", ")}
                                    <br />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </Modal>
                <QrcodeModal
                    showModal={this.showQrModal}
                    hideModal={this.hideQrModal}
                    visible={this.state.isQrModalVisible}
                    keyValue={this.state.wif}
                />
            </span>
        );
    }

    onOpen() {
        this.showModal();
    }

    onClose() {
        this.reset();
        this.hideModal();
    }

    onShow() {
        WalletUnlockActions.unlock()
            .then(() => {
                var private_key = WalletDb.getPrivateKey(this.props.pubkey);
                this.setState({wif: private_key.toWif()});
            })
            .catch(() => {});
    }

    onHide() {
        this.setState({wif: null});
    }
}
