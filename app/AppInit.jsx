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
import {HashRouter, BrowserRouter} from "react-router-dom";
import LoadingIndicator from "./components/LoadingIndicator";
const Router = __HASH_HISTORY__ ? HashRouter : BrowserRouter;
import InitError from "./components/InitError";

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
        const {theme} = this.props;
        const {apiConnected, apiError} = this.state;
        // let apiConnected = false, apiError = false;
        if (!apiConnected) {
            return (
                <div
                    style={{backgroundColor: !theme ? "#2a2a2a" : null}}
                    className={theme}
                >
                    <div id="content-wrapper">
                        <div className="grid-frame vertical">
                            {!apiError ? (
                                <LoadingIndicator loadingText="Connecting to API...." />
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
            theme: SettingsStore.getState().settings.get("themes")
        };
    }
});
AppInit = supplyFluxContext(alt)(AppInit);
export default hot(module)(AppInit);
