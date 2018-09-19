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
import LoadingIndicator from "./components/LoadingIndicator";
import InitError from "./components/InitError";
import SyncError from "./components/SyncError";
import counterpart from "counterpart";

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
            extendeLogText: []
        };
        this.saveExtendedLog = this.saveExtendedLog.bind(this);
    }

    componentDidCatch(error) {
        this.saveExtendedLog(error.stack);
    }

    componentWillMount() {
        const thiz = this;
        const _log = console.log;
        const _error = console.error;
        const _warn = console.warn;
        const _info = console.info;
        console.log = function() {
            thiz.saveExtendedLog(arguments);
            _log.apply(console, arguments);
        };
        console.warn = function() {
            thiz.saveExtendedLog(arguments);
            _warn.apply(console, arguments);
        };
        console.error = function() {
            thiz.saveExtendedLog(arguments);
            _error.apply(console, arguments);
        };
        console.info = function() {
            thiz.saveExtendedLog(arguments);
            _info.apply(console, arguments);
        };
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

    _statusCallback(status) {
        this.setState({status});
    }

    saveExtendedLog(logText) {
        const maxlogslength = 20;
        const logState = this.state.extendeLogText;
        var text = "";

        for (const value of logText) {
            text += JSON.stringify(value).slice(1, -1);
        }
        if (this.state.extendeLogText.length > maxlogslength) {
            logState.splice(0, 1);
        }
        if (text.indexOf(logState[this.state.extendeLogText.length - 1])) {
            logState.push(text);
            this.setState({extendeLogText: logState});
        }
    }

    render() {
        const {theme, apiServer} = this.props;
        const {apiConnected, apiError, syncError, status} = this.state;

        if (!apiConnected) {
            let server = apiServer;
            if (!!!server) {
                server = "";
            }
            return (
                <div
                    style={{backgroundColor: !theme ? "#2a2a2a" : null}}
                    className={theme}
                >
                    <div id="content-wrapper">
                        <div className="grid-frame vertical">
                            {!apiError ? (
                                <LoadingIndicator
                                    loadingText={
                                        status ||
                                        counterpart.translate(
                                            "app_init.connecting",
                                            {server: server}
                                        )
                                    }
                                />
                            ) : syncError ? (
                                <SyncError />
                            ) : (
                                <InitError />
                            )}
                        </div>
                    </div>
                </div>
            );
        }
        return <RootIntl {...this.props} {...this.state} />;
    }
}

AppInit = connect(AppInit, {
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
