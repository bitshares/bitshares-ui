var repl = require("repl");
var repl_history = require("repl.history");
var promisify = require("repl-promised").promisify;

var Apis = require('../dl/src/rpc_api/ApiInstances');
var ApplicationApi = require('../dl/src/rpc_api/ApplicationApi');
var WalletApi = require('../dl/src/rpc_api/WalletApi');
var DebugApi = require('../dl/src/rpc_api/DebugApi');

var iDB = require("../dl/src/idb-instance");
var fakeIndexedDB = require('fake-indexeddb');

var repl_instance = repl.start({
    prompt: "Graphene > ",
    input: process.stdin,
    output: process.stdout,
    ignoreUndefined: true
});

promisify(repl_instance);
repl_instance.on("exit", function () {
    Apis.instance().close();
});
var hist_file = process.env.HOME + "/.graphene_history";
repl_history(repl_instance, hist_file);

var dl_cli_index = require('dl_cli_index')
for(let object_name in dl_cli_index) {
    repl_instance.context[object_name] = dl_cli_index[object_name]
}

repl_instance.context.$g = {}
//var init_promise = iDB.init_instance.bind(repl_instance.context, fakeIndexedDB).init_promise
var init_promise = iDB.init_instance(fakeIndexedDB).init_promise

init_promise.then(()=> {
    return  Apis.instance().init_promise.then(() => {
        var database_api = Apis.instance().db_api();
        var network_api = Apis.instance().network_api();
        var history_api = Apis.instance().history_api();
        repl_instance.context.$g.db = database_api;
        repl_instance.context.$g.net = network_api;
        repl_instance.context.$g.history = history_api;
        repl_instance.context.$g.app = new ApplicationApi();
        repl_instance.context.$g.wallet = new WalletApi();
        repl_instance.context.$g.debug = new DebugApi();
    })
}).catch(error => {
    console.log("[App.js] ----- ERROR ----->", error, error.stack);
}).then(()=> {
    this.setState({loading: false});
});

