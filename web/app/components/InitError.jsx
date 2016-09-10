import React from "react";
import connectToStores from "alt/utils/connectToStores";
import HelpContent from "./Utility/HelpContent";
import BlockchainStore from "stores/BlockchainStore";
import SettingsStore from "stores/SettingsStore";
import Translate from "react-translate-component";
import WebsocketAddModal from "./Settings/WebsocketAddModal";
import SettingsActions from "actions/SettingsActions";
import {Apis} from "graphenejs-ws";

@connectToStores
class InitError extends React.Component {

    static getStores() {
        return [BlockchainStore, SettingsStore]
    }

    static getPropsFromStores() {
        return {
            rpc_connection_status: BlockchainStore.getState().rpc_connection_status,
            apis: SettingsStore.getState().defaults.apiServer,
            apiServer: SettingsStore.getState().settings.get("apiServer"),
            defaultConnection: SettingsStore.getState().defaultSettings.get("apiServer"),
        }
    }

    triggerModal(e) {
        console.log("triggerModal:");
        this.refs.ws_modal.show(e);
    }

    onChangeWS(e) {
        SettingsActions.changeSetting({setting: "apiServer", value: e.target.value });
        Apis.reset(e.target.value, true);
    }

    onReloadClick(e) {
        if (e) {
            e.preventDefault();
        }
        if (window.electron) {
            window.location.hash = "";
            window.remote.getCurrentWindow().reload();
        }
        else window.location.href = "/";
    }

    onReset() {
        SettingsActions.changeSetting({setting: "apiServer", value: this.props.defaultConnection });
        SettingsActions.clearSettings();
    }

    render() {
        let options = this.props.apis.map(entry => {
            return <option key={entry.url} value={entry.url}>{entry.location || entry.url} {entry.location ? `(${entry.url})` : null}</option>;
        });

        return (
            <div className="grid-block page-layout">
                <div className="grid-container">
                    <div className="grid-content no-overflow">
                        <br/>
                        <Translate component="h3" content={`init_error.title`} />
                        <br/>
                        <section className="block-list">
                            <header><Translate component="span" content={`settings.connection`} /></header>
                            <ul>
                                <li className="with-dropdown">

                                    <select onChange={this.onChangeWS.bind(this)} value={this.props.apiServer}>
                                        {options}
                                    </select>

                                    <div style={{paddingTop: 10}} className="button-group">
                                        <div
                                            onClick={this.triggerModal.bind(this)}
                                            className="button outline"
                                            id="add"
                                        >
                                                <Translate id="add_text" content="settings.add_api" />
                                        </div>
                                    </div>
                                </li>
                                <li className="key-value clearfix">
                                    <div className="float-left">Connection Status</div>
                                    <div className="float-right">
                                        {this.props.rpc_connection_status === "open" ? <span className="txtlabel success"><Translate content={`init_error.connected`} /></span> : <span className="txtlabel warning"><Translate content={`init_error.not_connected`} /></span>}
                                    </div>
                                </li>
                            </ul>
                        </section>
                        <br/>
                        <div className="button-group">
                            <div className="button outline" href onClick={this.onReloadClick}><Translate content={`init_error.retry`} /></div>

                            <div onClick={this.onReset.bind(this)} className="button outline">
                                <Translate content="settings.reset" />
                            </div>
                        </div>
                        <WebsocketAddModal ref="ws_modal" apis={this.props.apis} />
                    </div>
                </div>
            </div>
        );
    }
}

export default InitError;
