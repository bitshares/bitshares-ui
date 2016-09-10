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
        if (e.target.value.indexOf("ws://") !== -1 || e.target.value.indexOf("wss://") !== -1) {
            this.setState({ws: e.target.value});
        }
    }

    show(e) {
        console.log("show", e.target.id);
        let target;
        if (e.target.id.indexOf("add") !== -1) {
            target = "add";
        } else if (e.target.id.indexOf("remove") !== -1) {
            target = "remove";
        }
        this.setState({
            type: target
        });
        ZfApi.publish("ws_modal_" + target, "open")
    }

    close() {
        ZfApi.publish("ws_modal_" + this.state.type, "close")
    }

    onAddSubmit(e) {
        e.preventDefault();
        debugger;
        SettingsActions.addWS(this.state.ws);

        this.setState({
            ws: this.state.protocol === "https:" ? "wss://" : "ws://"
        });
        this.close();
    }

    onRemoveSubmit(e) {
        e.preventDefault();
        let removeIndex;
        debugger;
        this.props.apis.forEach((api, index) => {
            if (api.url === this.refs.select.value) {
                removeIndex = index;
            }
        });

        SettingsActions.removeWS(removeIndex);
        SettingsActions.changeSetting.defer({
            setting: "connection",
            value: this.props.apis[0]
        });
        this.props.changeConnection(this.props.apis[0]);
        this.close();
    }

    _renderAddModal() {
        return (
            <Modal id="ws_modal_add" ref="ws_modal_add" overlay={true} overlayClose={false}>
                <Trigger close="">
                    <div className="close-button">&times;</div>
                </Trigger>
                <div className="grid-content">
                    <Translate component="h3" content="settings.add_ws" />
                    <form onSubmit={this.onAddSubmit.bind(this)} noValidate>
                        <section className="block-list">
                        <ul>
                            <li className="with-dropdown">
                                <input type="text" onChange={this.onInput.bind(this)} value={this.state.ws} />
                            </li>
                        </ul>
                        </section>
                        <div className="button-group">
                            <button type="submit" className={"button"} onClick={this.onAddSubmit.bind(this)}>
                                <Translate content="transfer.confirm" />
                            </button>
                            <Trigger close={"ws_modal_add"}>
                                <div  className=" button"><Translate content="account.perm.cancel" /></div>
                            </Trigger>
                        </div>
                    </form>
                </div>
            </Modal>
        )
    }

    _renderRemoveModal() {
        if (!this.props.api) {
            return null;
        }
        let options = this.props.apis.map((entry, index) => {
            if (index > 0) {
                return <option value={entry.url} key={entry.url}>{entry.location || entry.url} {entry.location ? `(${entry.url})` : null}</option>;
            }
        }).filter(a => {
            return !!a;
        });

        return (
            <Modal id="ws_modal_remove" ref="ws_modal_remove" overlay={true} overlayClose={false}>
                <Trigger close="">
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-content no-overflow">
                    <Translate component="h3" content="settings.remove_ws" />
                    <section className="block-list">
                        <header><Translate component="span" content={"settings.connection"} /></header>
                        <ul>
                            <li className="with-dropdown">
                                <select ref="select">
                                    {options}
                                </select>
                            </li>
                        </ul>
                    </section>
                    <form onSubmit={this.onRemoveSubmit.bind(this)} noValidate>

                        <div className="button-group">
                            <button type="submit" className={"button"} onClick={this.onRemoveSubmit.bind(this)}>
                                <Translate content="transfer.confirm" />
                            </button>
                            <Trigger close={"ws_modal_remove"}>
                                <div className="button"><Translate content="account.perm.cancel" /></div>
                            </Trigger>
                        </div>
                    </form>
                </div>
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
