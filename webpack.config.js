var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var Clean = require("clean-webpack-plugin");
var git = require("git-rev-sync");
require("es6-promise").polyfill();
const CopyWebpackPlugin = require("copy-webpack-plugin");

// BASE APP DIR
var root_dir = path.resolve(__dirname);

module.exports = function(env) {
    // if (!env.profile) {
    //     console.log("env:", env);
    // }
    // console.log(env.prod ? "Using PRODUCTION options\n" : "Using DEV options\n");
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

    var scssLoaders = [
        {
            loader: "style-loader"
        },
        {
            loader: "css-loader"
        },
        {
            loader: "postcss-loader"
        },
        {
            loader: "sass-loader",
            options: {
                outputStyle: "expanded"
            }
        }
    ];

    // OUTPUT PATH
    var outputPath = path.join(root_dir, "assets");

    // COMMON PLUGINS
    const baseUrl = env.electron ? "" : "baseUrl" in env ? env.baseUrl : "/";
    var plugins = [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.DefinePlugin({
            APP_VERSION: JSON.stringify(git.tag()),
            __ELECTRON__: !!env.electron,
            __HASH_HISTORY__: !!env.hash,
            __BASE_URL__: JSON.stringify(baseUrl),
            __UI_API__: JSON.stringify(
                env.apiUrl || "https://ui.bitshares.eu/api"
            ),
            __TESTNET__: !!env.testnet,
            __DEPRECATED__: !!env.deprecated
        })
    ];
    if (env.prod) {
        // PROD OUTPUT PATH
        let outputDir = env.electron
            ? "electron"
            : env.hash
                ? !baseUrl
                    ? "hash-history"
                    : `hash-history_${baseUrl.replace("/", "")}`
                : "dist";
        outputPath = path.join(root_dir, "build", outputDir);

        // DIRECTORY CLEANER
        var cleanDirectories = [outputPath];

        // WRAP INTO CSS FILE
        const extractCSS = new ExtractTextPlugin("app.css");
        cssLoaders = ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: [
                {loader: "css-loader"},
                {
                    loader: "postcss-loader"
                }
            ]
        });
        scssLoaders = ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: [
                {loader: "css-loader"},
                {
                    loader: "postcss-loader"
                },
                {loader: "sass-loader", options: {outputStyle: "expanded"}}
            ]
        });

        // PROD PLUGINS
        plugins.push(new Clean(cleanDirectories, {root: root_dir}));
        plugins.push(
            new webpack.DefinePlugin({
                "process.env": {NODE_ENV: JSON.stringify("production")},
                __DEV__: false
            })
        );
        plugins.push(extractCSS);
        plugins.push(
            new webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false
            })
        );
        // plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
        if (!env.noUgly) {
            // plugins.push(
            //     new webpack.optimize.UglifyJsPlugin({
            //         sourceMap: true,
            //         compress: {
            //             warnings: true
            //         },
            //         output: {
            //             screw_ie8: true
            //         }
            //     })
            // );
        }
    } else {
        // plugins.push(new webpack.optimize.OccurenceOrderPlugin());
        plugins.push(
            new webpack.DefinePlugin({
                "process.env": {NODE_ENV: JSON.stringify("development")},
                __DEV__: true
            })
        );
        plugins.push(new webpack.HotModuleReplacementPlugin());
        // plugins.push(new webpack.NoEmitOnErrorsPlugin());
    }

    plugins.push(
        new CopyWebpackPlugin(
            [
                {
                    from: path.join(
                        root_dir,
                        "app",
                        "assets",
                        "locales",
                        "*.json"
                    ),
                    to: path.join(outputPath, "[name].[ext]"),
                    toType: "template"
                },
                {
                    from: path.join(
                        root_dir,
                        "app",
                        "lib",
                        "common",
                        "dictionary_en.json"
                    ),
                    to: path.join(outputPath, "dictionary.json"),
                    toType: "file"
                }
            ],
            {}
        )
    );

    var config = {
        mode: env.prod ? "production" : "development",
        entry: {
            // vendor: ["react", "react-dom", "highcharts/highstock", "bitsharesjs", "lodash"],
            app: env.prod
                ? path.resolve(root_dir, "app/Main.js")
                : [
                      "webpack-hot-middleware/client",
                      path.resolve(root_dir, "app/Main-dev.js")
                  ]
        },
        output: {
            publicPath: env.prod ? "" : "/",
            path: outputPath,
            filename: "[name].js",
            pathinfo: !env.prod,
            sourceMapFilename: "[name].js.map"
        },
        devtool: env.prod ? "none" : "eval",
        module: {
            rules: [
                {
                    test: /\.jsx$/,
                    include: [
                        path.join(root_dir, "app"),
                        path.join(
                            root_dir,
                            "node_modules/react-foundation-apps"
                        )
                    ],
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                cacheDirectory: env.prod ? false : true
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
                // {
                //     type: "javascript/auto",
                //     test: /\.json/,
                //     include: [
                //         path.resolve(root_dir, "app/lib/common"),
                //         path.resolve(root_dir, "app/assets/locales")
                //     ]
                // },
                {test: /\.coffee$/, loader: "coffee-loader"},
                {
                    test: /\.(coffee\.md|litcoffee)$/,
                    loader: "coffee-loader?literate"
                },
                {
                    test: /\.css$/,
                    use: cssLoaders
                },
                {
                    test: /\.scss$/,
                    use: scssLoaders
                },
                {
                    test: /\.png$/,
                    exclude: [
                        path.resolve(root_dir, "app/assets/asset-symbols"),
                        path.resolve(
                            root_dir,
                            "app/assets/language-dropdown/img"
                        )
                    ],
                    use: [
                        {
                            loader: "url-loader",
                            options: {
                                limit: 100000
                            }
                        }
                    ]
                },

                {
                    test: /\.woff$/,
                    use: [
                        {
                            loader: "url-loader",
                            options: {
                                limit: 100000,
                                mimetype: "application/font-woff"
                            }
                        }
                    ]
                },
                {
                    test: /.*\.svg$/,
                    loaders: ["svg-inline-loader", "svgo-loader"]
                },
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
                            loader: "markdown-loader",
                            options: {}
                        }
                    ]
                }
            ]
        },
        resolve: {
            modules: [
                path.resolve(root_dir, "app"),
                path.resolve(root_dir, "app/lib"),
                "node_modules"
            ],
            extensions: [".js", ".jsx", ".coffee", ".json"]
        },
        plugins: plugins
    };

    return config;
};
