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
            apiError: false
        };
    }

    componentWillMount() {
        willTransitionTo()
            .then(() => {
                this.setState({
                    apiConnected: true,
                    apiError: false
                });
            })
            .catch(err => {
                console.log("willTransitionTo err:", err);
                this.setState({
                    apiConnected: false,
                    apiError: true
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

    render() {
        const {theme, apiServer} = this.props;
        const {apiConnected, apiError} = this.state;

        if (!apiConnected) {
            return (
                <div
                    style={{backgroundColor: !theme ? "#2a2a2a" : null}}
                    className={theme}
                >
                    <div id="content-wrapper">
                        <div className="grid-frame vertical">
                            {!apiError ? (
                                <LoadingIndicator
                                    loadingText={counterpart.translate(
                                        "app_init.connecting",
                                        {server: apiServer}
                                    )}
                                />
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
            apiServer: SettingsStore.getState().settings.get("activeNode", "")
        };
    }
});
AppInit = supplyFluxContext(alt)(AppInit);
export default hot(module)(AppInit);
