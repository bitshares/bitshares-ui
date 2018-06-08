import React from "react";
import {ChainStore} from "bitsharesjs/es";
import AccountStore from "stores/AccountStore";
import NotificationStore from "stores/NotificationStore";
import {withRouter} from "react-router-dom";
import SyncError from "./components/SyncError";
import LoadingIndicator from "./components/LoadingIndicator";
import BrowserNotifications from "./components/BrowserNotifications/BrowserNotificationsContainer";
import Header from "components/Layout/Header";
import ReactTooltip from "react-tooltip";
import NotificationSystem from "react-notification-system";
import TransactionConfirm from "./components/Blockchain/TransactionConfirm";
import WalletUnlockModal from "./components/Wallet/WalletUnlockModal";
import BrowserSupportModal from "./components/Modal/BrowserSupportModal";
import Footer from "./components/Layout/Footer";
import Deprecate from "./Deprecate";
import Incognito from "./components/Layout/Incognito";
import {isIncognito} from "feature_detect";
import {updateGatewayBackers} from "common/gatewayUtils";
import titleUtils from "common/titleUtils";

import {Route, Switch} from "react-router-dom";

// Nested route components
import Page404 from "./components/Page404/Page404";
import ExchangeContainer from "./components/Exchange/ExchangeContainer";
import Explorer from "components/Explorer/Explorer";
import SettingsContainer from "./components/Settings/SettingsContainer";
import DashboardPage from "./components/Dashboard/DashboardPage";
import AccountPage from "./components/Account/AccountPage";
import AccountDepositWithdraw from "./components/Account/AccountDepositWithdraw";
import Transfer from "./components/Transfer/Transfer";
import LoginSelector from "./components/LoginSelector";
import News from "./components/News";
import Help from "./components/Help";
import Asset from "./components/Blockchain/Asset";
import BlockContainer from "./components/Blockchain/BlockContainer";
import DashboardAccountsOnly from "./components/Dashboard/DashboardAccountsOnly";
import {WalletManager} from "./components/Wallet/WalletManager";
import {CreateWalletFromBrainkey} from "./components/Wallet/WalletCreate";
import {ExistingAccount} from "./components/Wallet/ExistingAccount";

class App extends React.Component {
    constructor() {
        super();

        let syncFail =
            ChainStore.subError &&
            ChainStore.subError.message ===
                "ChainStore sync error, please check your system clock"
                ? true
                : false;
        this.state = {
            loading: false,
            synced: this._syncStatus(),
            syncFail,
            incognito: false,
            incognitoWarningDismissed: false,
            height: window && window.innerHeight
        };

        this._rebuildTooltips = this._rebuildTooltips.bind(this);
        this._chainStoreSub = this._chainStoreSub.bind(this);
        this._syncStatus = this._syncStatus.bind(this);
        this._getWindowHeight = this._getWindowHeight.bind(this);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._getWindowHeight);
        NotificationStore.unlisten(this._onNotificationChange);
        ChainStore.unsubscribe(this._chainStoreSub);
        clearInterval(this.syncCheckInterval);
    }

    _syncStatus(setState = false) {
        let synced = true;
        let dynGlobalObject = ChainStore.getObject("2.1.0");
        if (dynGlobalObject) {
            let block_time = dynGlobalObject.get("time");
            if (!/Z$/.test(block_time)) {
                block_time += "Z";
            }

            let bt =
                (new Date(block_time).getTime() +
                    ChainStore.getEstimatedChainTimeOffset()) /
                1000;
            let now = new Date().getTime() / 1000;
            synced = Math.abs(now - bt) < 5;
        }
        if (setState && synced !== this.state.synced) {
            this.setState({synced});
        }
        return synced;
    }

    _setListeners() {
        try {
            window.addEventListener("resize", this._getWindowHeight, {
                capture: false,
                passive: true
            });
            NotificationStore.listen(this._onNotificationChange.bind(this));
            ChainStore.subscribe(this._chainStoreSub);
            AccountStore.tryToSetCurrentAccount();
        } catch (e) {
            console.error("e:", e);
        }
    }

    componentDidMount() {
        this._setListeners();
        this.syncCheckInterval = setInterval(this._syncStatus, 5000);
        const user_agent = navigator.userAgent.toLowerCase();
        if (
            !(
                window.electron ||
                user_agent.indexOf("firefox") > -1 ||
                user_agent.indexOf("chrome") > -1 ||
                user_agent.indexOf("edge") > -1
            )
        ) {
            this.refs.browser_modal.show();
        }

        this.props.history.listen(this._rebuildTooltips);

        this._rebuildTooltips();

        isIncognito(
            function(incognito) {
                this.setState({incognito});
            }.bind(this)
        );
        updateGatewayBackers();
    }

    componentDidUpdate(prevProps) {
        if (this.props.location !== prevProps.location) {
            this.onRouteChanged();
        }
    }

    onRouteChanged() {
        document.title = titleUtils.GetTitleByPath(
            this.props.location.pathname
        );
    }

    _onIgnoreIncognitoWarning() {
        this.setState({incognitoWarningDismissed: true});
    }

    _rebuildTooltips() {
        ReactTooltip.hide();

        setTimeout(() => {
            if (this.refs.tooltip) {
                this.refs.tooltip.globalRebuild();
            }
        }, 1500);
    }

    _chainStoreSub() {
        let synced = this._syncStatus();
        if (synced !== this.state.synced) {
            this.setState({synced});
        }
        if (
            ChainStore.subscribed !== this.state.synced ||
            ChainStore.subError
        ) {
            let syncFail =
                ChainStore.subError &&
                ChainStore.subError.message ===
                    "ChainStore sync error, please check your system clock"
                    ? true
                    : false;
            this.setState({
                syncFail
            });
        }
    }

    /** Usage: NotificationActions.[success,error,warning,info] */
    _onNotificationChange() {
        let notification = NotificationStore.getState().notification;
        if (notification.autoDismiss === void 0) {
            notification.autoDismiss = 10;
        }
        if (this.refs.notificationSystem)
            this.refs.notificationSystem.addNotification(notification);
    }

    _getWindowHeight() {
        this.setState({height: window && window.innerHeight});
    }

    // /** Non-static, used by passing notificationSystem via react Component refs */
    // _addNotification(params) {
    //     console.log("add notification:", this.refs, params);
    //     this.refs.notificationSystem.addNotification(params);
    // }

    render() {
        let {incognito, incognitoWarningDismissed} = this.state;
        let {walletMode, theme} = this.props;

        let content = null;

        if (this.state.syncFail) {
            content = <SyncError />;
        } else if (this.state.loading) {
            content = (
                <div className="grid-frame vertical">
                    <LoadingIndicator
                        loadingText={"Connecting to APIs and starting app"}
                    />
                </div>
            );
        } else if (__DEPRECATED__) {
            content = <Deprecate {...this.props} />;
        } else {
            content = (
                <div className="grid-frame vertical">
                    <Header height={this.state.height} {...this.props} />
                    <div id="mainContainer" className="grid-block">
                        <div className="grid-block vertical">
                            <Switch>
                                <Route
                                    path="/"
                                    exact
                                    component={DashboardPage}
                                />
                                <Route
                                    path="/account/:account_name"
                                    component={AccountPage}
                                />
                                <Route
                                    path="/accounts"
                                    component={DashboardAccountsOnly}
                                />
                                <Route
                                    path="/market/:marketID"
                                    component={ExchangeContainer}
                                />
                                <Route
                                    path="/settings/:tab"
                                    component={SettingsContainer}
                                />
                                <Route
                                    path="/settings"
                                    component={SettingsContainer}
                                />

                                <Route
                                    path="/transfer"
                                    exact
                                    component={Transfer}
                                />
                                <Route
                                    path="/deposit-withdraw"
                                    exact
                                    component={AccountDepositWithdraw}
                                />
                                <Route
                                    path="/create-account"
                                    component={LoginSelector}
                                />
                                <Route path="/news" exact component={News} />

                                {/* Explorer routes */}
                                <Route
                                    path="/explorer/:tab"
                                    component={Explorer}
                                />
                                <Route path="/explorer" component={Explorer} />
                                <Route
                                    path="/asset/:symbol"
                                    component={Asset}
                                />
                                <Route
                                    exact
                                    path="/block/:height"
                                    component={BlockContainer}
                                />
                                <Route
                                    exact
                                    path="/block/:height/:txIndex"
                                    component={BlockContainer}
                                />

                                {/* Wallet backup/restore routes */}
                                <Route
                                    path="/wallet"
                                    component={WalletManager}
                                />
                                <Route
                                    path="/create-wallet-brainkey"
                                    component={CreateWalletFromBrainkey}
                                />
                                <Route
                                    path="/existing-account"
                                    component={ExistingAccount}
                                />

                                {/* Help routes */}
                                <Route exact path="/help" component={Help} />
                                <Route
                                    exact
                                    path="/help/:path1"
                                    component={Help}
                                />
                                <Route
                                    exact
                                    path="/help/:path1/:path2"
                                    component={Help}
                                />
                                <Route
                                    exact
                                    path="/help/:path1/:path2/:path3"
                                    component={Help}
                                />
                                <Route path="*" component={Page404} />
                            </Switch>
                        </div>
                    </div>
                    <Footer
                        synced={this.state.synced}
                        history={this.props.history}
                    />
                    <ReactTooltip
                        ref="tooltip"
                        place="top"
                        type={theme === "lightTheme" ? "dark" : "light"}
                        effect="solid"
                    />
                </div>
            );
        }

        return (
            <div
                style={{backgroundColor: !theme ? "#2a2a2a" : null}}
                className={theme}
            >
                {walletMode && incognito && !incognitoWarningDismissed ? (
                    <Incognito
                        onClickIgnore={this._onIgnoreIncognitoWarning.bind(
                            this
                        )}
                    />
                ) : null}
                <div id="content-wrapper">
                    {content}
                    <NotificationSystem
                        ref="notificationSystem"
                        allowHTML={true}
                        style={{
                            Containers: {
                                DefaultStyle: {
                                    width: "425px"
                                }
                            }
                        }}
                    />
                    <TransactionConfirm />
                    <BrowserNotifications />
                    <WalletUnlockModal />
                    <BrowserSupportModal ref="browser_modal" />
                </div>
            </div>
        );
    }
}

export default withRouter(App);
