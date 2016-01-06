import React from "react";
import Translate from "react-translate-component";
import Trigger from "react-foundation-apps/src/trigger"
import Modal from "react-foundation-apps/src/modal"
import ZfApi from "react-foundation-apps/src/utils/foundation-api"
import SettingsActions from "actions/SettingsActions";

class WebsocketAddModal extends React.Component {

    constructor() {
        super();

        let protocol = window.location.protocol;
        this.state = {
            protocol: protocol,
            ws: protocol === "https:" ? "wss://" : "ws://",
            type: "remove"
        };
    }

    onInput(e) {
        if (this.state.protocol === "https:") {
            e.target.value = e.target.value.replace("ws://", "wss://")
        }
        this.setState({ws: e.target.value});
    }

    show(e) {
        this.setState({
            type: e.target.id
        });
        ZfApi.publish("ws_modal_" + e.target.id, "open")
    }

    close() {
        ZfApi.publish("ws_modal_" + this.state.type, "close")
    }

    onAddSubmit(e) {
        e.preventDefault();

        SettingsActions.addWS(this.state.ws);

        this.setState({
            ws: this.state.protocol === "https:" ? "wss://" : "ws://"
        });
        this.close();
    }

    onRemoveSubmit(e) {
        e.preventDefault();
        let removeIndex = this.props.apis.indexOf(this.props.api[0]);
        SettingsActions.removeWS(removeIndex);
        this.close();
    }

    _renderAddModal() {
        return (
            <Modal id="ws_modal_add" ref="ws_modal_add" overlay={true} overlayClose={false}>
                <Trigger close="">
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <Translate component="h3" content="settings.add_ws" />
                <form onSubmit={this.onAddSubmit.bind(this)} noValidate>
                    <input type="text" onChange={this.onInput.bind(this)} value={this.state.ws} />
                    <div className="button-group">
                        <button className={"button"} onClick={this.onAddSubmit.bind(this)}>
                            <Translate content="transfer.confirm" />
                        </button>
                        <Trigger close={"ws_modal_add"}>
                            <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                        </Trigger>
                    </div>
                </form>
            </Modal>
        )
    }

    _renderRemoveModal() {
        if (!this.props.api) {
            return null;
        }
        let removeString;
        let options = this.props.api.map(entry => {
            removeString = entry;
            return <div key={entry}><h5>{entry}</h5></div>;
        });

        return (
            <Modal id="ws_modal_remove" ref="ws_modal_remove" overlay={true} overlayClose={false}>
                <Trigger close="">
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <Translate component="h3" content="settings.remove_ws" />
                    <section className="block-list">
                    <header><Translate component="span" content={`settings.connection`} /></header>
                    <ul>
                        <li className="with-dropdown">
                            {options}
                        </li>
                    </ul>
                    </section>
                <form onSubmit={this.onRemoveSubmit.bind(this)} noValidate>

                    <div className="button-group">
                        <button className={"button"} onClick={this.onRemoveSubmit.bind(this, )}>
                            <Translate content="transfer.confirm" />
                        </button>
                        <Trigger close={"ws_modal_remove"}>
                            <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                        </Trigger>
                    </div>
                </form>
            </Modal>
        )
    }

    render() {
        return (
            <div>
                {this._renderAddModal()}
                {this._renderRemoveModal()}
            </div>
        );
    }
}

export default WebsocketAddModal;