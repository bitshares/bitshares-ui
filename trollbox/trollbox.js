var config = require("./config");
var PeerServer = require('peer').PeerServer;

var psConfig = {
    port: config.port,
    path: '/trollbox',
    allow_discovery: true
};

if (config.useSSL) {
    psConfig.ssl = {
        key: fs.readFileSync(config.ssl.key),
        cert: fs.readFileSync(config.ssl.cert)
    }
}
var server = PeerServer(psConfig);

server.on('connection', function(id) { 
    console.log("connection from:", id);
});

server.on('disconnect', function(id) { 
    console.log("disconnect from:", id);
});

console.log("Trollbox listening at port", config.port);

