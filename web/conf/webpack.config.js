var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var Clean = require("clean-webpack-plugin");
var git = require("git-rev-sync");
require("es6-promise").polyfill();

// BASE APP DIR
var root_dir = path.resolve(__dirname, "..");

module.exports = function(options) {
    // console.log(options.prod ? "Using PRODUCTION options\n" : "Using DEV options\n");
    // STYLE LOADERS
    var cssLoaders = [
        {
            loader: "style-loader"
        },
        {
            loader: "css-loader"
        },
        {
            loader: "postcss-loader"
        }
    ];

    var scssLoaders =  [
        {
            loader: "style-loader"
        },
        {
            loader: "css-loader"
        },
        {
            loader: "postcss-loader",
            options: {
                plugins: [require("autoprefixer")]
            }
        },
        {
            loader: "sass-loader",
            options: {
                outputStyle: "expanded"
            }
        }
    ];

    // DIRECTORY CLEANER
    var cleanDirectories = ["dist"];

    // OUTPUT PATH
    var outputPath = path.join(root_dir, "assets");

    // COMMON PLUGINS
    var plugins = [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.DefinePlugin({
            APP_VERSION: JSON.stringify(git.tag()),
            __ELECTRON__: !!options.electron
        })
    ];

    if (options.prod) {
        // WRAP INTO CSS FILE
        const extractCSS = new ExtractTextPlugin("app.css");
        cssLoaders = extractCSS.extract({fallbackLoader: "style-loader",
            loader: [{loader: "css-loader"}, {loader: "postcss-loader", options: {
                plugins: [require("autoprefixer")]
            }}]}
        );
        scssLoaders = extractCSS.extract({fallbackLoader: "style-loader",
            loader: [{loader: "css-loader"}, {loader: "postcss-loader", options: {
                plugins: [require("autoprefixer")]
            }}, {loader: "sass-loader", options: {outputStyle: "expanded"}}]}
        );

        // PROD PLUGINS
        plugins.push(new Clean(cleanDirectories, {root: root_dir}));
        plugins.push(new webpack.DefinePlugin({"process.env": {NODE_ENV: JSON.stringify("production")}}));
        plugins.push(extractCSS);
        if (!options.noUgly) {
            plugins.push(new webpack.optimize.UglifyJsPlugin({
                minimize: true,
                sourceMap: true,
                compress: {
                    warnings: true
                },
                output: {
                    screw_ie8: true
                }
            }));
        }

        // plugins.push(new webpack.optimize.CommonsChunkPlugin({
        //     name: ["vendor"],
        //     filename: "vendor.js",
        //     minChunks: Infinity
        // }));

        // PROD OUTPUT PATH
        outputPath = path.join(root_dir, "dist");
    } else {
        // plugins.push(new webpack.optimize.OccurenceOrderPlugin());
        plugins.push(new webpack.DefinePlugin({"process.env": {NODE_ENV: JSON.stringify("development")}}));
        plugins.push(new webpack.HotModuleReplacementPlugin());
        plugins.push(new webpack.NoErrorsPlugin());
    }

    var config = {
        entry: {
            // vendor: ["react", "react-dom", "highcharts/highstock", "graphenejs-lib", "lodash"],
            app: options.prod ?
            path.resolve(root_dir, "app/Main.js") :
            [
                "react-hot-loader/patch",
                "webpack-hot-middleware/client",
                path.resolve(root_dir, "app/Main-dev.js")
            ]
        },
        output: {
            publicPath: "/",
            path: outputPath,
            filename: "[name].js",
            pathinfo: !options.prod,
            sourceMapFilename: "[name].js.map"
        },
        devtool: options.prod ? "cheap-module-source-map" : "eval",
        module: {
            rules: [
                {
                    test: /\.jsx$/,
                    include: [path.join(root_dir, "app"), path.join(root_dir, "node_modules/react-foundation-apps"), "/home/sigve/Dev/graphene/react-foundation-apps"],
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                cacheDirectory: options.prod ? false : true
                            }
                        }
                    ]
                },
                {
                    test: /\.js$/,
                    exclude: [/node_modules/],
                    loader: "babel-loader",
                    options: {compact: false, cacheDirectory: true}
                },
                {
                    test: /\.json/, loader: "json-loader",
                    exclude: [
                        path.resolve(root_dir, "lib/common"),
                        path.resolve(root_dir, "app/assets/locales")
                    ]
                },
                { test: /\.coffee$/, loader: "coffee-loader" },
                { test: /\.(coffee\.md|litcoffee)$/, loader: "coffee-loader?literate" },
                {
                    test: /\.css$/,
                    loader: cssLoaders
                },

                // var cssLoaders = "style-loader!css-loader!postcss-loader",
                //   scssLoaders =  "style-loader!css-loader!postcss-loader!sass-loader?outputStyle=expanded";

                {
                    test: /\.scss$/,
                    loader: scssLoaders
                },
                { test: /\.png$/, loader: "url-loader?limit=100000", exclude:[
                    path.resolve(root_dir, "app/assets/asset-symbols")
                ] },
                { test: /\.woff$/, loader: "url-loader?limit=100000&mimetype=application/font-woff" },
                { test: /.*\.svg$/, loaders: ["svg-inline-loader", "svgo-loader"] },
                {
                    test: /\.md/,
                    use: [
                        {
                            loader: "html-loader",
                            options: {
                                removeAttributeQuotes: false
                            }
                        },
                        {
                            loader: "remarkable-loader",
                            options: {
                                preset: "full",
                                typographer: true
                            }
                        }
                    ]
                }
            ]
        },
        resolve: {
            modules: [
                path.resolve(root_dir, "./app"),
                path.resolve(root_dir, "./lib"),
                "node_modules"
            ],
            extensions: [".js", ".jsx", ".coffee", ".json"],
            // fallback: [path.resolve(root_dir, "./node_modules")]
        },
        resolveLoader: {
            modules: [path.join(root_dir, "node_modules")],
            // fallback: [path.resolve(root_dir, "./node_modules")]
        },
        plugins: plugins
    };

    // if(options.prod) config.entry.vendors = [
    //     "classnames", "react-router", "highcharts/highstock", "counterpart", "react-translate-component",
    //     "perfect-scrollbar", "jdenticon", "react-notification-system", "react-tooltip",
    //     "whatwg-fetch", "alt", "react-json-inspector",
    //     "immutable", "graphenejs-lib"
    // ];

    return config;
};
