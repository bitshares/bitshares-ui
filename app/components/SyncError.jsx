import React from "react";
import {connect} from "alt-react";
import BlockchainStore from "stores/BlockchainStore";
import SettingsStore from "stores/SettingsStore";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import {Apis} from "bitsharesjs-ws";
import Icon from "./Icon/Icon";
import WebsocketAddModal from "./Settings/WebsocketAddModal";
import counterpart from "counterpart";
import AccessSettings from "./Settings/AccessSettings";

class SyncError extends React.Component {
    triggerModal(e) {
        this.refs.ws_modal.show(e);
    }

    onChangeWS(e) {
        SettingsActions.changeSetting({
            setting: "apiServer",
            value: e.target.value
        });
        Apis.reset(e.target.value, true);
        setTimeout(() => {
            this.onReloadClick();
        }, 50);
    }

    onReloadClick(e) {
        if (e) {
            e.preventDefault();
        }
        if (window.electron) {
            window.location.hash = "";
            window.remote.getCurrentWindow().reload();
        } else window.location.href = __BASE_URL__;
    }

    triggerModal(e, ...args) {
        this.refs.ws_modal.show(e, ...args);
    }

    render() {
        const {props} = this;
        let options = props.apis.map(entry => {
            let onlyDescription =
                entry.url.indexOf("fake.automatic-selection") !== -1;
            let {location} = entry;
            if (
                location &&
                typeof location === "object" &&
                "translate" in location
            )
                location = counterpart.translate(location.translate);

            return (
                <option key={entry.url} value={entry.url}>
                    {location || entry.url}{" "}
                    {!onlyDescription && location ? `(${entry.url})` : null}
                </option>
            );
        });

        return (
            <div className="grid-frame vertical">
                <div
                    className="grid-container text-center"
                    style={{
                        padding: "5rem 10% 0 10%",
                        maxWidth: "100%",
                        overflowY: "auto",
                        margin: "0 !important"
                    }}
                >
                    <h2>
                        <Translate content="sync_fail.title" />
                    </h2>
                    <br />
                    <p style={{marginBottom: 0}}>
                        <Translate content="sync_fail.sub_text_1" />
                    </p>
                    <Icon name="clock" title="icons.clock" size="5x" />

                    <p>
                        <Translate unsafe content="sync_fail.sub_text_2" />
                    </p>
                    <hr />

                    <AccessSettings
                        nodes={props.apis}
                        onChange={this.onChangeWS.bind(this)}
                        triggerModal={this.triggerModal.bind(this)}
                    />
                </div>

                <WebsocketAddModal
                    ref="ws_modal"
                    apis={props.apis}
                    api={props.apiServer}
                />
            </div>
        );
    }
}

SyncError = connect(SyncError, {
    listenTo() {
        return [BlockchainStore, SettingsStore];
    },
    getProps() {
        return {
            rpc_connection_status: BlockchainStore.getState()
                .rpc_connection_status,
            apis: SettingsStore.getState().defaults.apiServer,
            apiServer: SettingsStore.getState().settings.get("apiServer"),
            defaultConnection: SettingsStore.getState().defaultSettings.get(
                "apiServer"
            ),
            apiLatencies: SettingsStore.getState().apiLatencies
        };
    }
});

export default SyncError;
