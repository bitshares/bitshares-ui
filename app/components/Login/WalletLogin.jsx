import React, {Component} from "react";
import PropTypes from "prop-types";
import {Link} from "react-router-dom";
import {connect} from "alt-react";
import Translate from "react-translate-component";
import ReactTooltip from "react-tooltip";
import BackupStore from "stores/BackupStore";
import BackupActions from "actions/BackupActions";
import DecryptBackup from "./DecryptBackup";
import Icon from "../Icon/Icon";

class WalletLogin extends Component {
    static propTypes = {
        active: PropTypes.bool,
        backup: PropTypes.object,
        onChangeActive: PropTypes.func.isRequired,
        goToAccountModel: PropTypes.func.isRequired
    };

    static defaultProps = {
        active: false,
        backup: {}
    };

    componentDidMount() {
        BackupActions.reset();
    }

    componentDidUpdate() {
        if (this.props.backup.contents && !this.props.backup.public_key) {
            BackupActions.reset();
        }
    }

    onFileUpload(evt, droppedFile) {
        const file = droppedFile || evt.target.files[0];
        BackupActions.incommingWebFile(file);
        this.forceUpdate();
    }

    onDropBinFile(e) {
        e.preventDefault();
        this.onFileUpload(e, e.dataTransfer.files[0]);
    }

    renderTooltip() {
        return (
            <ReactTooltip
                id="without-bin"
                className="custom-tooltip text-left"
                globalEventOff="click"
            >
                <div
                    className="tooltip-text"
                    onClick={e => e.stopPropagation()}
                >
                    <Translate content="tooltip.login-tooltips.withoutBinFileBlock.begin" />
                    <Link to="/create-wallet-brainkey">
                        <Translate
                            component="u"
                            className="active-upload-text cursor-pointer"
                            content="tooltip.login-tooltips.withoutBinFileBlock.brainkey"
                        />
                    </Link>
                    <Translate content="tooltip.login-tooltips.withoutBinFileBlock.middle" />
                    <Translate
                        onClick={this.props.goToAccountModel}
                        className="without-bin cursor-pointer"
                        content="tooltip.login-tooltips.withoutBinFileBlock.model"
                    />
                    <Translate content="tooltip.login-tooltips.withoutBinFileBlock.end" />
                    <span
                        onClick={() => ReactTooltip.hide()}
                        className="close-button"
                    >
                        ×
                    </span>
                </div>
            </ReactTooltip>
        );
    }

    renderUploadInputForSmall() {
        const isDownloaded =
            this.props.backup.contents && this.props.backup.public_key;

        return (
            <div>
                <label
                    className="text-left left-label show-for-small-only"
                    htmlFor="backupFile"
                >
                    <Translate
                        content={
                            this.props.backup.contents
                                ? "login.selectDifferent"
                                : "login.browseFileLabel"
                        }
                    />
                </label>
                <div
                    onDragOver={e => e.preventDefault()}
                    onDragEnter={e => e.preventDefault()}
                    onDrop={e => this.onDropBinFile(e)}
                    className="small-container"
                >
                    {isDownloaded ? (
                        <span className="bin-name">
                            {this.props.backup.name}
                        </span>
                    ) : (
                        <span>&nbsp;</span>
                    )}
                    <span className="upload-text">
                        <u className="active-upload-text">
                            <input
                                ref="file_input"
                                accept=".bin"
                                type="file"
                                id="backupFile"
                                className="upload-bin-input"
                                onChange={e => this.onFileUpload(e)}
                            />
                            <Icon name="paperclip" className="attach-bin" />
                        </u>
                    </span>
                </div>
            </div>
        );
    }

    renderUploadInput() {
        const isInvalid =
            this.props.backup.contents && !this.props.backup.public_key;
        const isDownloaded =
            this.props.backup.contents && this.props.backup.public_key;

        return (
            <label className="cursor-pointer" htmlFor="backupFile">
                <div
                    onDragOver={e => e.preventDefault()}
                    onDragEnter={e => e.preventDefault()}
                    onDrop={e => this.onDropBinFile(e)}
                    className={`${isInvalid ? "invalid" : ""} ${
                        isDownloaded ? "downloaded" : ""
                    } file-input-container`}
                >
                    <img
                        className="rounded-arrow"
                        src="bin-file/rounded-arrow.svg"
                        alt="arrow"
                    />
                    {isDownloaded ? (
                        <img
                            className="bin-file"
                            src="bin-file/downloaded.svg"
                            alt="bin-file"
                        />
                    ) : isInvalid ? (
                        <img
                            className="bin-file"
                            src="bin-file/error.svg"
                            alt="bin-file"
                        />
                    ) : (
                        <span>
                            <img
                                className="bin-file show-on-hover"
                                src="bin-file/hover.svg"
                                alt="bin-file"
                            />
                            <img
                                className="bin-file hide-on-hover"
                                src="bin-file/default.svg"
                                alt="bin-file"
                            />
                        </span>
                    )}
                    <span className="upload-text text-left no-overflow">
                        {isDownloaded ? (
                            <p className="bin-name">
                                {this.props.backup.name} (
                                {this.props.backup.size} bytes)
                            </p>
                        ) : isInvalid ? (
                            <Translate
                                className="facolor-error"
                                content="login.invalidFormat"
                            />
                        ) : (
                            <Translate content="login.dropFile" />
                        )}
                        <u className="active-upload-text">
                            <input
                                ref="file_input"
                                accept=".bin"
                                type="file"
                                id="backupFile"
                                className="upload-bin-input"
                                onChange={e => this.onFileUpload(e)}
                            />
                            <Translate
                                content={
                                    this.props.backup.contents
                                        ? "login.selectDifferent"
                                        : "login.browseFile"
                                }
                            />
                        </u>
                    </span>
                </div>
            </label>
        );
    }

    render() {
        return (
            <div onClick={this.props.onChangeActive} className="wallet-block">
                <div className="overflow-bg-block show-for-small-only">
                    <span className="content" />
                </div>
                {new FileReader().readAsBinaryString ||
                !this.props.active ? null : (
                    <Translate
                        component="p"
                        className="error"
                        content="login.supportWarning"
                    />
                )}
                <div className={!this.props.active ? "display-none" : ""}>
                    {this.renderUploadInput()}
                    {this.renderUploadInputForSmall()}
                    <Translate
                        component="p"
                        className="text-left without-bin cursor-pointer hide-for-small-only"
                        content="login.withoutBinFile"
                        data-for="without-bin"
                        data-tip
                        data-event="click"
                        data-place="right"
                        data-effect="solid"
                    />
                    <Translate
                        component="p"
                        className="text-left without-bin cursor-pointer show-for-small-only"
                        content="login.withoutBinFile"
                        data-for="without-bin"
                        data-tip
                        data-event="click"
                        data-place="bottom"
                        data-effect="solid"
                    />
                    {this.renderTooltip()}
                </div>
                <DecryptBackup
                    active={this.props.active}
                    history={this.props.history}
                />
            </div>
        );
    }
}

const connectObject = {
    listenTo() {
        return [BackupStore];
    },
    getProps() {
        return {
            backup: BackupStore.getState()
        };
    }
};

export default connect(
    WalletLogin,
    connectObject
);
