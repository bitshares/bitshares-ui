var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var Clean = require("clean-webpack-plugin");

// BASE APP DIR
var root_dir = path.resolve(__dirname, "..");

// FUNCTION TO EXTRACT CSS FOR PRODUCTION
function extractForProduction(loaders) {
  return ExtractTextPlugin.extract("style", loaders.substr(loaders.indexOf("!")));
}

module.exports = function(options) {
    console.log(options.prod ? "Using PRODUCTION options\n" : "Using DEV options\n");
    // STYLE LOADERS
    var cssLoaders = "style-loader!css-loader",
      scssLoaders = "style!css!autoprefixer!sass?outputStyle=expanded";

    // DIRECTORY CLEANER
    var cleanDirectories = ["dist"];

    // OUTPUT PATH
    var outputPath = path.join(root_dir, "assets");

    // COMMON PLUGINS
    var plugins = [
        new webpack.optimize.DedupePlugin(),
        new Clean(cleanDirectories)
    ];

    if (options.prod) {
        // WRAP INTO CSS FILE
        cssLoaders = extractForProduction(cssLoaders);
        scssLoaders = extractForProduction(scssLoaders);

        // PROD PLUGINS
        plugins.push(new webpack.PrefetchPlugin("react"));
        plugins.push(new ExtractTextPlugin("app.css"));
        plugins.push(new webpack.optimize.UglifyJsPlugin({warnings: false, minimize: true, sourceMap: false}));
        plugins.push(new webpack.optimize.CommonsChunkPlugin("vendors", "vendors.js"));
        // PROD OUTPUT PATH
        outputPath = path.join(root_dir, "dist");
    } else {
        plugins.push(new webpack.HotModuleReplacementPlugin());
    }

    var config = {
        entry: {
            app: options.prod ?
                path.resolve(root_dir, "app/Main.js") :
                [
                    "webpack-dev-server/client?http://localhost:8080",
                    "webpack/hot/only-dev-server",
                    path.resolve(root_dir, "app/Main-dev.js")
                ]
        },
        output: {
            path: outputPath,
            filename: "app.js"
        },
        devtool: "#inline-source-map",
        debug: options.prod ? false : true,
        module: {
            loaders: [
                { 
                    test: /\.jsx$/,
                    include: [path.join(root_dir, "app"), path.join(root_dir, "node_modules/react-foundation-apps")],
                    loaders: options.prod ? ["babel-loader"] : ["react-hot", "babel-loader"] 
                },
                { 
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: "babel-loader",
                    query: {compact: false} 
                },
                { test: /\.json/, loader: "json" },
                { test: /\.coffee$/, loader: "coffee-loader" },
                { test: /\.(coffee\.md|litcoffee)$/, loader: "coffee-loader?literate" },
                { test: /\.css$/, loader: cssLoaders },
                {
                    test: /\.scss$/,
                    //loader: "style!css!sass?outputStyle=expanded&includePaths[]=" + (path.resolve(root_dir, "./node_modules"))
                    loader: scssLoaders
                },
                { test: /fonts\/.*\.(eot|ttf|woff|svg)$/, loader: "file?name=fonts/[name].[ext]?[hash]" },
                { test: /.*\.svg$/, loaders: ["svg-inline-loader", "svgo-loader"] }
            ]
        },
        resolve: {
            //alias: {lzma: path.resolve(root_dir, "./node_modules/lzma/src/lzma.js")},
            root: [path.resolve(root_dir, "./app"), path.resolve(root_dir, "../dl/src")],
            extensions: ["", ".js", ".jsx", ".coffee", ".json"],
            modulesDirectories: ["node_modules", "bower_components", path.resolve(root_dir, "../dl/lib")],
            fallback: [path.resolve(root_dir, "./node_modules")]
        },
        resolveLoader: {
            root: path.join(root_dir, "node_modules"),
            fallback: [path.resolve(root_dir, "./node_modules")]
        },
        plugins: plugins,
        root: outputPath
    };

    if(options.prod) config.entry.vendors = [
        "react", "react-highcharts/stocks.js", "classnames", "react-router", "counterpart", "react-translate-component",
        "perfect-scrollbar", "jdenticon", "react-notification-system", "react-tooltip",
        "whatwg-fetch", "alt", "react-json-inspector",
        "immutable", "lzma", "bytebuffer_3.5.4.js", "intl", "lodash"
    ];

    return config;

}
