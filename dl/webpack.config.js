var path = require("path");
var webpack = require("webpack");

if(process.env.PROD){
    console.log("PRODUCTION mode");
}
else if(process.env.TEST){
    console.log("TEST mode");
}
else{
    console.log("DEVELOPMENT mode");
}

var config = {
    output: {
        path: path.resolve(__dirname, "bundle"),
        filename: "bundle.js"
    },
    cache: true,
    debug: process.env.PROD ? false : true,
    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"},
            { test: /\.json/, loader: "json" },
            { test: /\.coffee$/, loader: "coffee-loader" },
            { test: /\.(coffee\.md|litcoffee)$/, loader: "coffee-loader?literate" }
        ]
    },
    resolve: {
        root: [path.resolve(__dirname, "./src")],
        extensions: ["", ".js", ".coffee", ".json"],
        modulesDirectories: ["node_modules", "bower_components"],
        fallback: [path.resolve(__dirname, "./node_modules")]
    },
    resolveLoader: {
        root: path.join(__dirname, "node_modules"),
        fallback: [path.resolve(__dirname, "./node_modules")]
    }
};

module.exports = config;
