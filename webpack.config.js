var path = require("path");
var webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var git = require("git-rev-sync");
require("es6-promise").polyfill();
const CopyWebpackPlugin = require("copy-webpack-plugin");
var locales = require("./app/assets/locales");
const HtmlWebpackPlugin = require("html-webpack-plugin");
var fs = require("fs");

/*
 * For staging builds, set the version to the latest commit hash, for
 * production set it to the package version
 */
let branch = !!process.env.BRANCH ? process.env.BRANCH : git.branch();
var __VERSION__ =
    branch === "develop" ? git.short() : require("./package.json").version;

// BASE APP DIR
var root_dir = path.resolve(__dirname);

module.exports = function(env) {
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
            loader: "sass-loader"
        }
    ];

    // OUTPUT PATH
    var outputPath = path.join(root_dir, "assets").replace(/\\/g, "/");

    // COMMON PLUGINS
    const baseUrl = env.electron
        ? "./"
        : "baseUrl" in env
        ? env.baseUrl === "false"
            ? ""
            : env.baseUrl
        : "/";

    /*
     * moment and react-intl include tons of locale files, use a regex and
     * ContextReplacementPlugin to only include certain locale files
     */
    let regexString = "";
    locales.forEach((l, i) => {
        regexString = regexString + (l + (i < locales.length - 1 ? "|" : ""));
    });
    const localeRegex = new RegExp(regexString);
    var plugins = [
        new HtmlWebpackPlugin({
            template: "!!handlebars-loader!app/assets/index.hbs",
            templateParameters: {
                title: "BitShares " + __VERSION__,
                INCLUDE_BASE: !!env.prod && !env.hash,
                PRODUCTION: !!env.prod,
                ELECTRON: !!env.electron
            }
        }),

        new webpack.DefinePlugin({
            APP_VERSION: JSON.stringify(__VERSION__),
            __ELECTRON__: !!env.electron,
            __HASH_HISTORY__: !!env.hash,
            __BASE_URL__: JSON.stringify(baseUrl),
            __UI_API__: JSON.stringify(env.apiUrl),
            __TESTNET__: !!env.testnet,
            __DEPRECATED__: !!env.deprecated,
            DEFAULT_SYMBOL: "BTS",
            __GIT_BRANCH__: JSON.stringify(git.branch()),
            __PERFORMANCE_DEVTOOL__: !!env.perf_dev
        }),
        new webpack.ContextReplacementPlugin(
            /moment[\/\\]locale$/,
            localeRegex
        ),
        new webpack.ContextReplacementPlugin(
            /react-intl[\/\\]locale-data$/,
            localeRegex
        ),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(root_dir, "charting_library"),
                    to: "charting_library"
                }
            ]
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

        // WRAP INTO CSS FILE
        cssLoaders = [
            {loader: MiniCssExtractPlugin.loader},
            {loader: "css-loader"},
            {loader: "postcss-loader"}
        ];
        scssLoaders = [
            {loader: MiniCssExtractPlugin.loader},
            {loader: "css-loader"},
            {loader: "postcss-loader"},
            {
                loader: "sass-loader",
                options: {sassOptions: {outputStyle: "expanded"}}
            }
        ];

        // PROD PLUGINS
        plugins.push(
            new webpack.DefinePlugin({
                "process.env": {NODE_ENV: JSON.stringify("production")},
                __DEV__: false
            })
        );
        plugins.push(
            new MiniCssExtractPlugin({
                filename: "[name].[contenthash].css"
            })
        );
    } else {
        plugins.push(
            new webpack.DefinePlugin({
                "process.env": {NODE_ENV: JSON.stringify("development")},
                __DEV__: true
            })
        );
        plugins.push(new webpack.HotModuleReplacementPlugin());
    }

    plugins.push(
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.posix.join(
                        path
                            .join(root_dir, "app", "assets", "locales")
                            .replace(/\\/g, "/"),
                        "*.json"
                    ),
                    to: path.join(outputPath, "[name][ext]"),
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
                },
                {
                    from: path.join(
                        root_dir,
                        "app",
                        "assets",
                        "outdated_browser.css"
                    ),
                    to: path.join(outputPath, "outdated_browser.css"),
                    toType: "file"
                }
            ]
        })
    );

    /* Workaround in which the github pages server will find a file when it looks
    for /deposit-withdraw that will redirect to the hash router's equivalent
    /#/deposit-withdraw */

    if (env.hash)
        plugins.push(
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(
                            root_dir,
                            "app",
                            "components",
                            "DepositWithdraw",
                            "blocktrades",
                            "index.html"
                        ),
                        to: path.join(
                            outputPath,
                            "deposit-withdraw",
                            "index.html"
                        ),
                        toType: "file"
                    }
                ]
            })
        );
    var alias = {
        sanitize$: "xss",
        moment$: path.resolve(root_dir, "node_modules/moment/moment.js"),
        bitsharesjs$: path.resolve(root_dir, "node_modules/bitsharesjs/"),
        "bitshares-ui-style-guide$": path.resolve(
            root_dir,
            "node_modules/bitshares-ui-style-guide/dist/main.js"
        )
    };
    if (!env.prod) {
        alias = Object.assign({}, alias, {
            "react-dom": "@hot-loader/react-dom"
        });
    }
    var https = false;
    if (env.https) {
        https = {
            key: fs.readFileSync("./ssl/server.key"),
            cert: fs.readFileSync("./ssl/server.crt")
        };
    }
    var config = {
        mode: env.noUgly ? "none" : env.prod ? "production" : "development",
        entry: {
            app: env.prod
                ? path.resolve(root_dir, "app/Main.js")
                : [
                      "react-hot-loader/patch",
                      path.resolve(root_dir, "app/Main.js")
                  ]
        },
        output: {
            publicPath: env.prod ? "" : "/",
            path: outputPath,
            filename: env.prod ? "[name].[chunkhash].js" : "[name].js",
            chunkFilename: env.prod ? "[name].[chunkhash].js" : "[name].js",
            pathinfo: !env.prod,
            sourceMapFilename: "[name].js.map",
            globalObject: "this",
            clean: true
        },
        devServer: {
            hot: true,
            static: {
                directory: path.join(__dirname, "app/assets/locales"),
                publicPath: env.prod ? "" : "/"
            },
            historyApiFallback: true,
            https: https,
            devMiddleware: {
                index: true,
                mimeTypes: {phtml: "text/html"},
                publicPath: env.prod ? "" : "/"
            }
        },
        optimization: {
            splitChunks: {
                cacheGroups: {
                    styles: {
                        name: "styles",
                        test: /\.css$/,
                        chunks: "all",
                        enforce: true
                    },
                    vendor: {
                        name: "vendor",
                        test: /node_modules/,
                        chunks: "initial",
                        enforce: true
                    }
                }
            }
        },
        devtool:
            env.noUgly || !env.prod
                ? "inline-cheap-module-source-map"
                : "cheap-source-map",
        module: {
            rules: [
                {
                    // Test for a polyfill (or any file) and it won't be included in your
                    // bundle
                    test: /node-fetch/,
                    use: "null-loader"
                },
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
                                presets: [
                                    [
                                        "@babel/preset-react",
                                        {targets: {node: "current"}}
                                    ]
                                ],
                                cacheDirectory: env.prod ? false : true,
                                plugins: ["react-hot-loader/babel"]
                            }
                        }
                    ]
                },
                {
                    test: /\.js$/,
                    include: [
                        path.join(root_dir, "app"),
                        path.join(root_dir, "node_modules/react-datepicker2"),
                        path.join(root_dir, "node_modules/alt-container"),
                        path.join(root_dir, "node_modules/alt-react")
                    ],
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                compact: false,
                                cacheDirectory: env.prod ? false : true,
                                plugins: ["react-hot-loader/babel"],
                                presets: [
                                    [
                                        "@babel/preset-react",
                                        {targets: {node: "current"}}
                                    ]
                                ]
                            }
                        }
                    ]
                },
                {
                    test: /\.mjs$/,
                    include: /node_modules/,
                    type: "javascript/auto"
                },
                {test: /\.coffee$/, loader: "coffee-loader"},
                {
                    test: /\.(coffee\.md|litcoffee)$/,
                    loader: "coffee-loader",
                    options: {
                        literate: true
                    }
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
                    exclude: [
                        path.resolve(root_dir, "app/assets/model-type-images"),
                        path.resolve(root_dir, "app/assets/bin-file")
                    ],
                    use: [
                        {
                            loader: "svg-inline-loader"
                        },
                        {
                            loader: "svgo-loader",
                            options: {
                                plugins: [
                                    {name: "cleanupAttrs", active: true},
                                    {name: "removeMetadata", active: true},
                                    {name: "removeXMLNS", active: true},
                                    {name: "removeViewBox", active: false}
                                ]
                            }
                        }
                    ]
                },
                {
                    test: /\.md/,
                    use: [
                        {
                            loader: "html-loader",
                            options: {sources: false}
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
            extensions: [".js", ".jsx", ".coffee", ".json"],
            mainFields: ["module", "jsnext:main", "browser", "main"],
            alias: alias,
            fallback: {
                crypto: require.resolve("crypto-browserify"),
                constants: require.resolve("constants-browserify"),
                stream: require.resolve("stream-browserify"),
                path: require.resolve("path-browserify")
            }
        },
        plugins: plugins
    };

    return config;
};
