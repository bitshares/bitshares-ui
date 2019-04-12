var path = require("path");
var webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var Clean = require("clean-webpack-plugin");
// var git = require("git-rev-sync");
var pkg = require("./package.json");
require("es6-promise").polyfill();
const CopyWebpackPlugin = require("copy-webpack-plugin");
var locales = require("./app/assets/locales");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

/* Load .env configuration so that it can be included in WebPack config */
const envConfig = require("dotenv").config().parsed;
let processEnv = {};

for (let key in envConfig) {
    const envValue = envConfig[key];
    const envKey =
        key ||
        (!/^__(.*)__$/.test(key) ? "__" + key + "__" : key).toUpperCase();

    processEnv[envKey] = JSON.stringify(envValue);
}

/*
* For staging builds, set the version to the latest commit hash, for
* production set it to the package version
*/
// let branch = !!process.env.BRANCH ? process.env.BRANCH : git.branch();
var __VERSION__ = `${pkg.version}`;

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
            loader: "sass-loader",
            options: {
                outputStyle: "expanded"
            }
        }
    ];

    // OUTPUT PATH
    var outputPath = path.join(root_dir, "assets");
    var revision = process.env.CODEBUILD_RESOLVED_SOURCE_VERSION || "";

    // COMMON PLUGINS
    const baseUrl = env.electron ? "./" : "baseUrl" in env ? env.baseUrl : "/";

    /*
    * moment and react-intl include tons of locale files, use a regex and
    * ContextReplacementPlugin to only include certain locale files
    */
    let regexString = "";
    locales.forEach((l, i) => {
        regexString = regexString + (l + (i < locales.length - 1 ? "|" : ""));
    });
    const localeRegex = new RegExp(regexString);

    const isStageNet = !!process.env.__STAGENET__ || !!env.stagenet;
    const isTestNet = !!process.env.__TESTNET__ || !!env.testnet;
    const isDevNet = !!process.env.__DEVNET__;

    const recaptchaSiteKey =
        process.env.RECAPTCHA_SITE_KEY ||
        env.RECAPTCHA_SITE_KEY ||
        "6LdlhIsUAAAAAHzlruhPZ4yJKPd5Zo18eLRFP7hj";

    const cryptoBridgePubKey =
        process.env.CRYPTOBRIDGE_PUB_KEY ||
        env.CRYPTOBRIDGE_PUB_KEY ||
        "BTS74ePvhPVtYw79orHZkHgfpGr5vRJ1ZPyDDZcCBEg275DGpCy8k";

    const walletUrl =
        process.env.__WALLET_URL__ || "https://wallet.crypto-bridge.org";
    const apiUrl = process.env.__API_URL__ || "https://api.crypto-bridge.org";

    var plugins = [
        new HtmlWebpackPlugin({
            template: "!!handlebars-loader!app/assets/index.hbs",
            templateParameters: {
                title: "CryptoBridge",
                walletUrl,
                INCLUDE_BASE: !!env.prod && !env.hash,
                PRODUCTION: !!env.prod,
                ELECTRON: !!env.electron
            }
        }),
        new webpack.DefinePlugin(
            Object.assign(
                {},
                {
                    APP_VERSION: JSON.stringify(__VERSION__),
                    APP_REVISION: JSON.stringify(`${revision.substr(0, 7)}`),
                    __ELECTRON__: !!env.electron,
                    __HASH_HISTORY__: !!env.hash,
                    __BASE_URL__: JSON.stringify(baseUrl),
                    __UI_API__: JSON.stringify(
                        env.apiUrl || "https://ui.bitshares.eu/api"
                    ),
                    __API_URL__: JSON.stringify(apiUrl),
                    __WALLET_URL__: JSON.stringify(walletUrl),
                    __DEVNET__: isDevNet,
                    __TESTNET__: isTestNet,
                    __STAGENET__: isStageNet,
                    __DEPRECATED__: !!env.deprecated,
                    __RECAPTCHA_SITE_KEY__: JSON.stringify(recaptchaSiteKey),
                    __CRYPTOBRIDGE_PUB_KEY__: JSON.stringify(
                        cryptoBridgePubKey
                    ),
                    __BCO_ASSET_ID__: JSON.stringify(
                        isDevNet ? "1.3.2" : "1.3.1564"
                    ),
                    __BCO_ASSET_PRECISION__: 7,
                    DEFAULT_SYMBOL: "BTS",
                    "process.env": processEnv
                }
            )
        ),
        new webpack.ContextReplacementPlugin(
            /moment[\/\\]locale$/,
            localeRegex
        ),
        new webpack.ContextReplacementPlugin(
            /react-intl[\/\\]locale-data$/,
            localeRegex
        ),
        new CopyWebpackPlugin([
            {
                from: path.join(root_dir, "charting_library"),
                to: "charting_library"
            }
        ])
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
        cssLoaders = [
            {loader: MiniCssExtractPlugin.loader},
            {loader: "css-loader"},
            {
                loader: "postcss-loader",
                options: {
                    minimize: true,
                    debug: false
                }
            }
        ];
        scssLoaders = [
            {loader: MiniCssExtractPlugin.loader},
            {loader: "css-loader"},
            {
                loader: "postcss-loader",
                options: {
                    minimize: true,
                    debug: false
                }
            },
            {loader: "sass-loader", options: {outputStyle: "expanded"}}
        ];

        // PROD PLUGINS
        plugins.push(new Clean(cleanDirectories, {root: root_dir}));
        plugins.push(
            new webpack.DefinePlugin({
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
                "process.env": Object.assign(processEnv, {
                    NODE_ENV: JSON.stringify("development")
                }),
                __DEV__: true
            })
        );
        plugins.push(new webpack.HotModuleReplacementPlugin());
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
        mode: env.noUgly ? "none" : env.prod ? "production" : "development",
        entry: {
            app: env.prod
                ? path.resolve(root_dir, "app/Main.js")
                : [
                      "webpack-hot-middleware/client",
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
            globalObject: "this"
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
            },
            minimizer: [
                new UglifyJsPlugin({
                    cache: true,
                    parallel: true,
                    uglifyOptions: {
                        compress: false,
                        ecma: 6,
                        mangle: true
                    },
                    sourceMap: true
                })
            ]
        },
        devtool: env.noUgly || !env.prod ? "cheap-module-source-map" : "none",
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
                        path.join(root_dir, "node_modules/react-datepicker2")
                    ],
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                compact: false,
                                cacheDirectory: env.prod ? false : true,
                                plugins: ["react-hot-loader/babel"]
                            }
                        }
                    ]
                },
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
                        ),
                        path.resolve(root_dir, "app/assets/other")
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
                    use: [
                        {
                            loader: "svg-inline-loader"
                        },
                        {
                            loader: "svgo-loader",
                            options: {
                                plugins: [
                                    {cleanupAttrs: true},
                                    {removeMetadata: true},
                                    {removeXMLNS: true},
                                    {removeViewBox: false}
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
