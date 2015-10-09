var WebSocketRpc = require("./WebSocketRpc");
var GrapheneApi = require("./GrapheneApi");
import SettingsStore from "../stores/SettingsStore";

class Apis {

    connect() {
        if (this.ws_rpc) return; // already connected
        let connection_string, rpc_user, rpc_password;
        try { // For command-line support, all references to "window" go in the try catch
            let rpc_host, rpc_port;
            let args = window.location.hash.split("/");
            if (args.length > 2) {
                let parts = args[2].split(":");
                rpc_user = parts[0];
                rpc_password = parts[1];
                rpc_host = parts[2];
                rpc_port = parts[3];
            }
            if (rpc_host) {
                let protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
                let port = rpc_port ? `:${rpc_port}` : "";
                connection_string = `${protocol}${rpc_host}${port}`
            }
        } catch (e) {}
        if (!connection_string) connection_string = SettingsStore.getSetting("connection");
        //connection_string = "ws://localhost:8090";
        console.log(`connecting to ${connection_string}`);
        this.ws_rpc = new WebSocketRpc(connection_string);
        this.init_promise = this.ws_rpc.login(rpc_user, rpc_password).then(() => {
            this._db_api = new GrapheneApi(this.ws_rpc, "database");
            if (window) window.$db_api = this._db_api;
            this._network_api = new GrapheneApi(this.ws_rpc, "network_broadcast");
            this._history_api = new GrapheneApi(this.ws_rpc, "history");
            var db_promise = this._db_api.init().then( ()=> {
                //https://github.com/cryptonomex/graphene/wiki/chain-locked-tx
                return this._db_api.exec("get_chain_id",[]).then( _chain_id => {
                    this.chain_id = _chain_id
                    //DEBUG console.log("chain_id1",this.chain_id)
                });
            });
            this.ws_rpc.on_reconnect = () => {
                this.ws_rpc.login("", "").then(() => {
                    this._db_api.init().then(() => {
                        if(this.update_rpc_connection_status_callback)
                            this.update_rpc_connection_status_callback("reconnect");
                    });
                    this._network_api.init();
                    this._history_api.init();
                });
            }
            return Promise.all([db_promise,
                this._network_api.init(),
                this._history_api.init()]);
        });
    }
    
    close() {
        this.ws_rpc.close();
        this.ws_rpc = null
    }
    
    db_api () {
        return this._db_api;
    }
    
    network_api () {
        return this._network_api;
    }
    
    history_api () {
        return this._history_api;
    }

    setRpcConnectionStatusCallback(callback) {
        this.update_rpc_connection_status_callback = callback;
        this.ws_rpc.setRpcConnectionStatusCallback(callback);
    }
    
}

var apis_instance;

module.exports = {
    setRpcConnectionStatusCallback: function(callback) {
        if(apis_instance) apis_instance.setRpcConnectionStatusCallback(callback);
    },
    instance: function () {
        if ( !apis_instance ) {
            apis_instance = new Apis();
            apis_instance.connect();
        }
        return apis_instance;
    }
};
