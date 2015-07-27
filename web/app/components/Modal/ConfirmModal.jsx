import React from "react";
import {PropTypes} from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import SettingsActions from "actions/SettingsActions";
import Translate from "react-translate-component";

class ConfirmModal extends React.Component {
    constructor() {
        super();
        this.state = {show: true};
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.modalId !== this.props.modalId ||
            nextState.content !== this.state.content
        );
    }

    show(content, confirmText, callback) {
        this.setState({
            content: content,
            confirmText: confirmText,
            callback: callback
        });

        ZfApi.publish(this.props.modalId, "open");
    }

    confirmClicked(e) {
        e.preventDefault();
        ZfApi.publish(this.props.modalId, "close");       
        this.state.callback();   
    }

    _onCheck(e) {
        e.preventDefault();
        this.setState({show: !this.state.show});
        SettingsActions.changeSetting({setting: this.props.setting, value: !this.props.value});
        this.forceUpdate();
    }

    render() {
        return (
            <Modal id={this.props.modalId} overlay={true}>
                <Trigger close={this.props.modalId}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical">
                    <div className="shrink grid-content">
                        <p>{this.state.content}</p>
                        {this.props.setting ? 
                            (<div style={{marginBottom: "1rem"}}>
                                <Translate component="label" content="settings.always_confirm" />
                                {/* This won't work using a single <input> with checked={this.state.show}, not sure why */
                                    this.state.show ? <input key="true_checked" type="checkbox" checked={true} onChange={this._onCheck.bind(this)}/> : 
                                    <input key="false_checked" type="checkbox" checked={false} onChange={this._onCheck.bind(this)}/>}
                            </div>)
                            : null}
                    </div>
                    <div className="grid-content button-group">
                        <a className="button" href onClick={this.confirmClicked.bind(this)}>{this.state.confirmText}</a>
                        <Trigger close={this.props.modalId}>
                            <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                        </Trigger>
                    </div>
                </div>
            </Modal>
        );
    }
}

ConfirmModal.defaultProps = {
    modalId: "confirm_modal",
    setting: null
};

ConfirmModal.propTypes = {
    modalId: PropTypes.string.isRequired,
    setting: PropTypes.string,
    value: PropTypes.bool
};

export default ConfirmModal;
