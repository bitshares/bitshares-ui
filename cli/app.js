var repl = require("repl");
var repl_history = require("repl.history");
var promisify = require("repl-promised").promisify;

var Apis = require('../dl/src/rpc_api/ApiInstances');
var ApplicationApi = require('../dl/src/rpc_api/ApplicationApi');
var WalletApi = require('../dl/src/rpc_api/WalletApi');

Apis.instance().init_promise.then(() => {
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
    var database_api = Apis.instance().db_api();
    var network_api = Apis.instance().network_api();
    repl_instance.context.$g = {}
    repl_instance.context.$g.db = database_api;
    repl_instance.context.$g.net = network_api;
    repl_instance.context.$g.app = new ApplicationApi();
    repl_instance.context.$g.wallet = new WalletApi();
    var hist_file = process.env.HOME + "/.graphene_history";
    repl_history(repl_instance, hist_file);
}).catch(error => {
    console.log("[App.js] ----- ERROR ----->", error, error.stack);
    this.setState({loading: false});
});

