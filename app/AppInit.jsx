import {hot} from "react-hot-loader";
import React from "react";
import App from "./App";
import IntlActions from "actions/IntlActions";
import WalletManagerStore from "stores/WalletManagerStore";
import SettingsStore from "stores/SettingsStore";
import IntlStore from "stores/IntlStore";
import intlData from "./components/Utility/intlData";
import alt from "alt-instance";
import {connect, supplyFluxContext} from "alt-react";
import {IntlProvider} from "react-intl";
import willTransitionTo from "./routerTransition";
import {BodyClassName} from "bitshares-ui-style-guide";
import LoadingIndicator from "./components/LoadingIndicator";
import InitError from "./components/InitError";
import SyncError from "./components/SyncError";
import counterpart from "counterpart";
import LogsActions from "actions/LogsActions";
import NodeSelector from "./components/Utility/NodeSelector";
/*
* Electron does not support browserHistory, so we need to use hashHistory.
* The same is true for servers without configuration options, such as Github Pages
*/
import {HashRouter, BrowserRouter} from "react-router-dom";

const Router = __HASH_HISTORY__ ? HashRouter : BrowserRouter;

class RootIntl extends React.Component {
    componentWillMount() {
        IntlActions.switchLocale(this.props.locale);
    }

    render() {
        return (
            <IntlProvider
                locale={this.props.locale}
                formats={intlData.formats}
                initialNow={Date.now()}
            >
                <Router>
                    <App {...this.props} />
                </Router>
            </IntlProvider>
        );
    }
}

class AppInit extends React.Component {
    constructor() {
        super();

        this.state = {
            apiConnected: false,
            apiError: false,
            syncError: null,
            status: "",
            extendeLogText: [], // used to cache logs when not mounted
            nodeFilterHasChanged: false,
            showNodeFilter: false
        };
        this.mounted = true;
        this.persistentLogEnabled = false;
    }

    /**
     * Global error catching and forwarding to log handler
     * @param error
     */
    componentDidCatch(error) {
        this.saveExtendedLog("error", [error]);
    }

    componentDidUpdate(nextProps, nextState) {
        LogsActions.setLog(nextState.extendeLogText);
    }

    saveExtendedLog(type, logText) {
        const maxlogslength = 19;
        const logState = this.state.extendeLogText;
        var text = "";

        for (const value of logText) {
            text += value;
        }
        text = [type, ": ", text].join("");
        if (logState.length > maxlogslength) {
            logState.splice(0, 1);
        }
        if (text.indexOf(logState[logState.length - 1])) {
            logState.push(text);
            if (this.mounted) {
                this.setState({extendeLogText: logState});
            } else {
                LogsActions.setLog(logState);
            }
        }
    }

    _enablePersistingLog() {
        if (this.persistentLogEnabled) return;

        if (!this.state.extendeLogText.length) {
            LogsActions.getLogs().then(data => {
                if (data) {
                    this.setState({extendeLogText: data});
                }
            });
        }

        const thiz = this;
        const saveLog = (type, log) => {
            if (
                log.length > 1 &&
                typeof log[1] === "string" &&
                log[1] === "html2canvas:"
            ) {
                return;
            }
            thiz.saveExtendedLog(type, Array.from(log));
            if (thiz.mounted) {
                console[`str${type}`].apply(console, log);
            }
        };

        // see https://www.sitepoint.com/javascript-decorators-what-they-are/ for decorator

        // see https://stackoverflow.com/questions/9559725/extending-console-log-without-affecting-log-line for line numbers

        console.strlog = console.log.bind(console);
        console.strerror = console.error.bind(console);
        console.strwarn = console.warn.bind(console);
        console.strinfo = console.info.bind(console);
        console.strtimeEnd = console.timeEnd.bind(console);
        console.strdebug = console.debug.bind(console);

        console.log = function() {
            saveLog("log", arguments);
        };
        console.warn = function() {
            saveLog("warn", arguments);
        };
        console.error = function() {
            saveLog("error", arguments);
        };
        console.info = function() {
            saveLog("info", arguments);
        };
        console.timeEnd = function() {
            saveLog("timeEnd", arguments);
        };
        console.debug = function() {
            saveLog("debug", arguments);
        };

        this.persistentLogEnabled = true;
    }

    componentWillMount() {
        if (!__DEV__) {
            this._enablePersistingLog();
        }
        setTimeout(() => {
            this.setState({
                showNodeFilter: true
            });
        }, 5000);
        willTransitionTo(true, this._statusCallback.bind(this))
            .then(() => {
                this.setState({
                    apiConnected: true,
                    apiError: false,
                    syncError: null
                });
            })
            .catch(err => {
                console.log("willTransitionTo err:", err);
                this.setState({
                    apiConnected: false,
                    apiError: true,
                    syncError: !err
                        ? null
                        : (err && err.message).indexOf(
                              "ChainStore sync error"
                          ) !== -1
                });
            });
    }

    componentDidMount() {
        this.mounted = true;
        //Detect OS for platform specific fixes
        if (navigator.platform.indexOf("Win") > -1) {
            var main = document.getElementById("content");
            var windowsClass = "windows";
            if (main.className.indexOf("windows") === -1) {
                main.className =
                    main.className +
                    (main.className.length ? " " : "") +
                    windowsClass;
            }
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    _statusCallback(status) {
        this.setState({status});
    }

    _onNodeFilterChange() {
        this.setState({
            nodeFilterHasChanged: true
        });
    }

    _renderLoadingScreen() {
        let server = this.props.apiServer;
        if (!!!server) {
            server = "";
        }
        return (
            <React.Fragment>
                <LoadingIndicator
                    loadingText={
                        this.state.status ||
                        counterpart.translate("app_init.connecting", {
                            server: server
                        })
                    }
                >
                    {this.state.showNodeFilter && (
                        <div className="padding">
                            <NodeSelector
                                onChange={this._onNodeFilterChange.bind(this)}
                            />
                            {this.state.nodeFilterHasChanged && (
                                <div style={{marginTop: "1rem"}}>
                                    Please reload for the changes to take effect
                                </div>
                            )}
                        </div>
                    )}
                </LoadingIndicator>
            </React.Fragment>
        );
    }

    render() {
        const {theme} = this.props;
        const {apiConnected, apiError, syncError} = this.state;

        if (!apiConnected) {
            return (
                <div
                    style={{backgroundColor: !theme ? "#2a2a2a" : null}}
                    className={theme}
                >
                    <div id="content-wrapper">
                        <div className="grid-frame vertical">
                            <BodyClassName className={theme}>
                                {!apiError ? (
                                    this._renderLoadingScreen()
                                ) : syncError ? (
                                    <SyncError />
                                ) : (
                                    <InitError />
                                )}
                            </BodyClassName>
                        </div>
                    </div>
                </div>
            );
        }
        return <RootIntl {...this.props} {...this.state} />;
    }
}

AppInit = connect(
    AppInit,
    {
        listenTo() {
            return [IntlStore, WalletManagerStore, SettingsStore];
        },
        getProps() {
            return {
                locale: IntlStore.getState().currentLocale,
                walletMode:
                    !SettingsStore.getState().settings.get("passwordLogin") ||
                    !!WalletManagerStore.getState().current_wallet,
                theme: SettingsStore.getState().settings.get("themes"),
                apiServer: SettingsStore.getState().settings.get(
                    "activeNode",
                    ""
                )
            };
        }
    }
);
AppInit = supplyFluxContext(alt)(AppInit);
export default hot(module)(AppInit);
