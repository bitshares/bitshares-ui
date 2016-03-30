import React from "react";
import connectToStores from "alt/utils/connectToStores";
import HelpContent from "./Utility/HelpContent";
import BlockchainStore from "stores/BlockchainStore";
import SettingsStore from "stores/SettingsStore";
import Translate from "react-translate-component";
import WebsocketAddModal from "./Settings/WebsocketAddModal";
import SettingsActions from "actions/SettingsActions";

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

    triggerModal(e) {
        console.log("triggerModal:");
        this.refs.ws_modal.show(e);
    }

    onChangeWS(e) {
        SettingsActions.changeSetting({setting: "connection", value: e.target.value });        
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
            return <option key={entry}>{entry}</option>;
        });

        return (
            <div className="grid-block page-layout">
                <div className="grid-container">
                    <div className="grid-content">
                        <br/>
                        <Translate component="h3" content={`init_error.title`} />
                        <br/>
                        <section className="block-list">
                            <header><Translate component="span" content={`settings.connection`} /></header>
                            <ul>
                                <li className="with-dropdown">
                                    <div style={{position: "absolute", right: "0.8rem", top: "0.2rem"}}
                                         className="button no-margin outline"
                                         onClick={this.triggerModal.bind(this)} id="add"
                                         data-tip="Add connection string" data-type="light">+</div>
                                    <select onChange={this.onChangeWS.bind(this)} value={this.props.connection}>
                                        {options}
                                    </select>
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
                        <div className="button no-margin" href onClick={this.onReloadClick}><Translate content={`init_error.retry`} /></div>
                        <br />
                        <div onClick={this.onReset.bind(this)} className="button" style={{marginTop: 15}}>
                            <Translate content="settings.reset" />
                        </div>
                        <WebsocketAddModal ref="ws_modal" apis={this.props.apis} />
                    </div>
                </div>
            </div>
        );
    }
}

export default InitError;
