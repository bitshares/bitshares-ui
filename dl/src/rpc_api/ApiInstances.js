var WebSocketRpc = require("./WebSocketRpc");
var GrapheneApi = require("./GrapheneApi");

class Apis {
    constructor() {
       this.rpc_user = "";
       this.rpc_password = "";
    }

    connect(hostname="localhost", port=8090) {
        console.log( "Connecting..." );
        let protocol = "ws://", path = "";
        try { // For command-line support, all references to "window" go in the try catch
           let args     = window.location.hash.split("/");
            if (args.length > 2) {
                let parts = args[2].split(":");
                this.rpc_user = parts[0];
                this.rpc_pass = parts[1];
                this.rpc_ip = parts[2];
                this.rpc_port = parts[3];
            }
            if (this.ws_rpc) return; // already connected
            if (this.rpc_ip) hostname = this.rpc_ip;
            else hostname = window.location.hostname ? window.location.hostname : "localhost";
            if (this.rpc_port ) port = this.rpc_port;
            protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        } catch(e) {}
        //hostname = "graphene.bitshares.org"; protocol = "wss://"; port = "443"; path = "/ws/";
        console.log(`connecting to ${protocol}${hostname}:${port}${path}`);
        this.ws_rpc = new WebSocketRpc(`${protocol}${hostname}:${port}${path}`);
        this.init_promise = this.ws_rpc.login(this.rpc_user, this.rpc_password).then(() => {
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
    instance: function ( host="localhost", port=8090) {
        if ( !apis_instance ) {
            apis_instance = new Apis();
            apis_instance.connect(host, port);
        }
        return apis_instance;
    }
};
