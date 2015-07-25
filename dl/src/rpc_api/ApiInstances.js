var WebSocketRpc = require("./WebSocketRpc");
var GrapheneApi = require("./GrapheneApi");

var Apis = (function () {

    var apis_instance;
    var ws_rpc;
    var db_api;
    var network_api;
    var history_api;
    var indexedDB;
    
    function init() {
        //console.log("[ApiInstances.js] ----- init ----->");
        //var WEBSOCKET_URL = process.env.WEBSOCKET_URL || "ws://localhost:8090"
        //console.log('WEBSOCKET_URL\t',WEBSOCKET_URL)
        
        // uncomment the following line to use the internal testnet instead of a localhost witness node
        //  ws_rpc = new WebSocketRpc("ws://104.200.28.117:8090");
        let hostname = "localhost";
        try { hostname = window.location.hostname } catch(e) {}
        ws_rpc = new WebSocketRpc("ws://" + hostname + ":8090");
        
        var init_promise = ws_rpc.login("", "").then(() => {
            db_api = new GrapheneApi(ws_rpc, "database");
            network_api = new GrapheneApi(ws_rpc, "network_broadcast");
            history_api = new GrapheneApi(ws_rpc, "history");
            return Promise.all([db_api.init(), network_api.init(), history_api.init()]);
        });
        return {
            init_promise: init_promise,
            close: function () {
                ws_rpc.close();
                apis_instance = null;
            },
            db_api: function () {
                return db_api;
            },
            network_api: function () {
                return network_api;
            },
            history_api: function () {
                return history_api;
            }
        };
    }

    return {
        instance: function () {
            if ( !apis_instance ) {
                apis_instance = init();
            }
            return apis_instance;
        }
    };

})();

module.exports = Apis;
