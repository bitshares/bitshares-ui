import React from "react";
import connectToStores from "alt/utils/connectToStores";
import HelpContent from "./Utility/HelpContent";
import BlockchainStore from "stores/BlockchainStore";
import SettingsStore from "stores/SettingsStore";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import {Apis} from "graphenejs-ws";
import Icon from "./Icon/Icon";
import WebsocketAddModal from "./Settings/WebsocketAddModal";

@connectToStores
class InitError extends React.Component {

    static getStores() {
        return [BlockchainStore, SettingsStore]
    }

    static getPropsFromStores() {
        return {
            rpc_connection_status: BlockchainStore.getState().rpc_connection_status,
            apis: SettingsStore.getState().defaults.connection,
            connection: SettingsStore.getState().settings.get("connection"),
            defaultConnection: SettingsStore.getState().defaultSettings.get("connection"),
        }
    }

    onChangeWS(e) {
        SettingsActions.changeSetting({setting: "connection", value: e.target.value });
        Apis.reset(e.target.value, true);
    }

    triggerModal(e) {
        console.log("triggerModal:");
        this.refs.ws_modal.show(e);
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
        SettingsActions.changeSetting({setting: "connection", value: this.props.defaultConnection });
        SettingsActions.clearSettings();
    }

    render() {
        console.log("-- InitError.render -->", this.props);

        let options = this.props.apis.map(entry => {
            return <option key={entry} value={entry}>{entry}</option>;
        });

        return (

            <div className="grid-frame vertical">

                <div className="grid-container text-center" style={{paddingTop: "5rem", maxWidth: "40rem"}}>

                    <h2><Translate content="sync_fail.title" /></h2>
                    <br />
                    <p style={{marginBottom: 0}}><Translate content="sync_fail.sub_text_1" /></p>
                    <Icon name="clock" size="5x"/>

                    <p><Translate content="sync_fail.sub_text_2" /></p>
                </div>
                <div className="grid-container text-center" style={{paddingTop: "1rem", maxWidth: "40rem"}}>
                <section className="block-list">
                    <header><Translate component="span" content={`settings.connection`} /></header>
                    <ul>
                        <li className="with-dropdown">

                            <select onChange={this.onChangeWS.bind(this)} value={this.props.connection}>
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
        );
    }
}

export default InitError;
