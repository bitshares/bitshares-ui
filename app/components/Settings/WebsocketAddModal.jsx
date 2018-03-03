import React from "react";
import Translate from "react-translate-component";
import Trigger from "react-foundation-apps/src/trigger";
import BaseModal from "../Modal/BaseModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import SettingsActions from "actions/SettingsActions";

const ws = "ws://";
const wss = "wss://";

class WebsocketAddModal extends React.Component {
    constructor() {
        super();

        let protocol = window.location.protocol;
        this.state = {
            protocol: protocol,
            ws: wss,
            name: "My node",
            type: "remove",
            remove: {},
            addError: null,
            existsError: null
        };
    }

    onServerInput(e) {
        let state = {
            ws: e.target.value
        };

        if (this.apiExists(state.ws)) {
            state.existsError = true;
        } else {
            state.existsError = null;
        }

        if (state.ws.indexOf(wss) !== 0 && state.ws.indexOf(ws) !== 0) {
            state.addError = true;
        } else {
            state.addError = null;
        }

        this.setState(state);
    }

    apiExists(url) {
        return !!this.props.apis.find(api => api.url === url);
    }

    onNameInput(e) {
        this.setState({name: e.target.value});
    }

    show(e, url, name) {
        let state = {};
        if (e.target.id.indexOf("add") !== -1) {
            state.type = "add";
        } else if (e.target.id.indexOf("remove") !== -1) {
            state.type = "remove";
            state.remove = {url, name};
        }

        this.setState(state);

        ZfApi.publish("ws_modal_" + state.type, "open");
    }

    close() {
        ZfApi.publish("ws_modal_" + this.state.type, "close");
    }

    onAddSubmit(e) {
        e.preventDefault();

        SettingsActions.addWS({location: this.state.name, url: this.state.ws});

        this.setState({
            ws: this.state.protocol === "https:" ? wss : ws,
            name: ""
        });
        this.close();
    }

    onRemoveSubmit(e) {
        e.preventDefault();
        let removeIndex;
        this.props.apis.forEach((api, index) => {
            if (api.url === this.state.remove.url) {
                removeIndex = index;
            }
        });

        /* Set default if removing currently active API server */
        if (this.props.api === this.props.apis[removeIndex].url) {
            SettingsActions.changeSetting.defer({
                setting: "apiServer",
                value: this.props.apis[0].url
            });
            this.props.changeConnection(this.props.apis[0].url);
        }

        SettingsActions.removeWS(removeIndex);
        this.close();
    }

    _renderAddModal() {
        let labelStyle = {padding: 0, color: "white"};

        return (
            <BaseModal
                id="ws_modal_add"
                ref="ws_modal_add"
                overlay={true}
                overlayClose={false}
            >
                <div className="grid-content">
                    <Translate component="h3" content="settings.add_ws" />
                    <form onSubmit={this.onAddSubmit.bind(this)} noValidate>
                        <section className="block-list">
                            <ul>
                                <li
                                    className="with-dropdown"
                                    style={{marginBottom: "1em"}}
                                >
                                    <label style={labelStyle}>Name</label>
                                    <input
                                        type="text"
                                        onChange={this.onNameInput.bind(this)}
                                        value={this.state.name}
                                    />
                                </li>
                                <li className="with-dropdown">
                                    <label style={labelStyle}>Address</label>
                                    <input
                                        type="text"
                                        onChange={this.onServerInput.bind(this)}
                                        defaultValue={this.state.ws}
                                    />
                                </li>
                            </ul>
                            {this.state.addError && (
                                <p style={{marginBottom: "1em"}}>
                                    <Translate content="settings.valid_node_url" />
                                </p>
                            )}
                            {this.state.existsError && (
                                <p style={{marginBottom: "1em"}}>
                                    <Translate content="settings.node_already_exists" />
                                </p>
                            )}
                        </section>
                        <div className="button-group">
                            <button
                                type="submit"
                                className={
                                    "button " +
                                    (this.state.addError ||
                                    this.state.existsError
                                        ? "disabled"
                                        : "")
                                }
                                onClick={this.onAddSubmit.bind(this)}
                                disabled={this.state.addError}
                            >
                                <Translate content="transfer.confirm" />
                            </button>
                            <Trigger close={"ws_modal_add"}>
                                <div className=" button">
                                    <Translate content="account.perm.cancel" />
                                </div>
                            </Trigger>
                        </div>
                    </form>
                </div>
            </BaseModal>
        );
    }

    _renderRemoveModal() {
        if (!this.props.api) {
            return null;
        }

        return (
            <BaseModal
                id="ws_modal_remove"
                ref="ws_modal_remove"
                overlay={true}
                overlayClose={false}
            >
                <div className="grid-content no-overflow">
                    <Translate component="h3" content="settings.remove_ws" />
                    <section className="block-list">
                        <p>
                            <Translate
                                component="span"
                                content="settings.confirm_remove"
                                with={{name: this.state.remove.name}}
                            />
                        </p>
                    </section>
                    <form onSubmit={this.onRemoveSubmit.bind(this)} noValidate>
                        <div className="button-group">
                            <button
                                type="submit"
                                className={"button"}
                                onClick={this.onRemoveSubmit.bind(this)}
                            >
                                <Translate content="transfer.confirm" />
                            </button>
                            <Trigger close={"ws_modal_remove"}>
                                <div className="button">
                                    <Translate content="account.perm.cancel" />
                                </div>
                            </Trigger>
                        </div>
                    </form>
                </div>
            </BaseModal>
        );
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
