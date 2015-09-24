var path = require("path");
var webpack = require("webpack");

var config = {
    entry: path.resolve(__dirname, "app.js"),
    target: "node",
    output: {
        path: path.join(path.resolve(__dirname), "bundle"),
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel"},
            { test: /\.json/, loader: "json" },
            { test: /\.coffee$/, loader: "coffee" }
        ]
    },
    resolve: {
        root: [path.resolve(__dirname, "./"), path.resolve(__dirname, "../dl/src")],
        extensions: ["", ".js", ".jsx", ".json", ".coffee"],
        modulesDirectories: ["node_modules"],
        fallback: [path.resolve(__dirname, "./node_modules")]
    },
    resolveLoader: {
        fallback: [path.resolve(__dirname, "./node_modules")]
    },
    plugins: [
        new webpack.IgnorePlugin(/\.(css|less)$/),
        new webpack.BannerPlugin("require('source-map-support').install();", { raw: true, entryOnly: false })
    ],
    devtool: "sourcemap"
};

module.exports = config;
