var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

//if(process.env.PROD){
//    console.log("PRODUCTION mode");
//}
//else if(process.env.TEST){
//    console.log("TEST mode");
//}
//else{
//    console.log("DEVELOPMENT mode");
//}

var config = {
    entry: path.resolve(__dirname, "app/App.jsx"),
    output: {
        path: path.resolve(__dirname, "bundle"),
        filename: "app.js"
    },
    cache: true,
    debug: process.env.PROD ? false : true,
    module: {
        loaders: [
            { test: /\.jsx$/, loaders: ["react-hot", "babel-loader"] },
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"},
            { test: /\.json/, loader: "json" },
            { test: /\.coffee$/, loader: "coffee-loader" },
            { test: /\.(coffee\.md|litcoffee)$/, loader: "coffee-loader?literate" },
            { test: /\.css$/, loader: ExtractTextPlugin.extract("style!css") },
            {
                test: /\.scss$/,
                //loader: "style!css!sass?outputStyle=expanded&includePaths[]=" + (path.resolve(__dirname, "./node_modules"))
                loader: ExtractTextPlugin.extract("css!sass?outputStyle=expanded&includePaths[]=" + (path.resolve(__dirname, "./node_modules")))
            },
            { test: /fonts\/.*\.(eot|ttf|woff|svg)$/, loader: "file?name=fonts/[name].[ext]?[hash]" },
            { test: /.*\.svg$/, loaders: ["svg-inline-loader", "svgo-loader"] }
        ]
    },
    resolve: {
        //alias: {lzma: path.resolve(__dirname, "./node_modules/lzma/src/lzma.js")},
        root: [path.resolve(__dirname, "./app"), path.resolve(__dirname, "../dl/src")],
        extensions: ["", ".js", ".jsx", ".coffee", ".json"],
        modulesDirectories: ["node_modules", "bower_components"],
        fallback: [path.resolve(__dirname, "./node_modules")]
    },
    resolveLoader: {
        root: path.join(__dirname, "node_modules"),
        fallback: [path.resolve(__dirname, "./node_modules")]
    },
    plugins: [
        new webpack.ResolverPlugin(
            new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])
        ),
        new ExtractTextPlugin("app.css")
    ]
};

module.exports = config;
