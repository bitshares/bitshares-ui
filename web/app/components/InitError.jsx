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
            connection: SettingsStore.getState().settings.get("connection")
        }
    }

    triggerModal() {
        this.refs.ws_modal.show("ws_modal_add");
    }

    onChangeWS(e) {
        SettingsActions.changeSetting({setting: "connection", value: e.target.value });
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
                        <Translate component="h3" content={`init_error.title`} />
                        <br/>
                        {this.props.rpc_connection_status === "error" ? <HelpContent path="components/InitError" section="connection-error"/> : null}
                        <br/>
                        <h5><Translate content={`init_error.ws_status`} />: {this.props.rpc_connection_status === "open" ? <span className="txtlabel success"><Translate content={`init_error.connected`} /></span> : <span className="txtlabel warning"><Translate content={`init_error.not_connected`} /></span>}</h5>
                        <br/>
                        <section className="block-list">
                        <header><Translate component="span" content={`settings.connection`} /></header>
                        <ul>
                            <li className="with-dropdown">
                                <div style={{position: "absolute", right: 0}} onClick={this.triggerModal} id="add" className="button">+</div>
                                <select onChange={this.onChangeWS.bind(this)} value={this.props.connection}>
                                    {options}
                                </select>
                            </li>
                        </ul>
                        </section>
                        <br/>
                        <a className="button" href="/"><Translate content={`init_error.retry`} /></a>
                        <WebsocketAddModal ref="ws_modal" apis={this.props.apis} />
                    </div>
                </div>
            </div>
        );
    }
}

export default InitError;
