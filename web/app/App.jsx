import {ChainStore} from "graphenejs-lib";
import {Apis} from "graphenejs-ws";

import React from "react";
import ReactDOM from "react-dom";
import {Router, Route, IndexRoute, Redirect} from "react-router";
import IntlStore from "stores/IntlStore"; // This needs to be initalized here even though IntlStore is never used
import DashboardContainer from "./components/Dashboard/DashboardContainer";
import Explorer from "./components/Explorer/Explorer";
import Blocks from "./components/Explorer/BlocksContainer";
import Assets from "./components/Explorer/AssetsContainer";
import AccountsContainer from "./components/Explorer/AccountsContainer";
import Witnesses from "./components/Explorer/Witnesses";
import CommitteeMembers from "./components/Explorer/CommitteeMembers";
import Header from "components/Layout/Header";
import Footer from "./components/Layout/Footer";
import AccountPage from "./components/Account/AccountPage";
import AccountOverview from "./components/Account/AccountOverview";
import AccountAssets from "./components/Account/AccountAssets";
import AccountAssetCreate from "./components/Account/AccountAssetCreate";
import AccountAssetUpdate from "./components/Account/AccountAssetUpdate";
import AccountMembership from "./components/Account/AccountMembership";
import AccountVesting from "./components/Account/AccountVesting";
import AccountDepositWithdraw from "./components/Account/AccountDepositWithdraw";
import AccountPermissions from "./components/Account/AccountPermissions";
import AccountWhitelist from "./components/Account/AccountWhitelist";
import AccountVoting from "./components/Account/AccountVoting";
import AccountOrders from "./components/Account/AccountOrders";
import Exchange from "./components/Exchange/ExchangeContainer";
import Markets from "./components/Exchange/MarketsContainer";
import Transfer from "./components/Transfer/Transfer";
import Settings from "./components/Settings/SettingsContainer";
import FeesContainer from "./components/Blockchain/FeesContainer";
import BlockContainer from "./components/Blockchain/BlockContainer";
import AssetContainer from "./components/Blockchain/AssetContainer";
import Transaction from "./components/Blockchain/Transaction";
import CreateAccount from "./components/Account/CreateAccount";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import IntlActions from "actions/IntlActions";
import MobileMenu from "components/Layout/MobileMenu";
import LoadingIndicator from "./components/LoadingIndicator";
import TransactionConfirm from "./components/Blockchain/TransactionConfirm";
import WalletUnlockModal from "./components/Wallet/WalletUnlockModal";
import NotificationSystem from "react-notification-system";
import NotificationStore from "stores/NotificationStore";
import iDB from "idb-instance";
import ExistingAccount, {ExistingAccountOptions} from "./components/Wallet/ExistingAccount";
import WalletCreate from "./components/Wallet/WalletCreate";
import ImportKeys from "./components/Wallet/ImportKeys";
import WalletDb from "stores/WalletDb";
import PrivateKeyActions from "actions/PrivateKeyActions";
import ReactTooltip from "react-tooltip";
import Invoice from "./components/Transfer/Invoice";
import {BackupCreate, BackupRestore} from "./components/Wallet/Backup";
import WalletChangePassword from "./components/Wallet/WalletChangePassword";
import WalletManagerStore from "stores/WalletManagerStore";
import WalletManager, {WalletOptions, ChangeActiveWallet, WalletDelete} from "./components/Wallet/WalletManager";
import BalanceClaimActive from "./components/Wallet/BalanceClaimActive";
import BackupBrainkey from "./components/Wallet/BackupBrainkey";
import Brainkey from "./components/Wallet/Brainkey";
import AccountRefsStore from "stores/AccountRefsStore";
import Help from "./components/Help";
import InitError from "./components/InitError";
import BrowserSupportModal from "./components/Modal/BrowserSupportModal";
import createBrowserHistory from "history/lib/createHashHistory";
import {IntlProvider} from "react-intl";
import intlData from "./components/Utility/intlData";
import connectToStores from "alt/utils/connectToStores";
import Chat from "./components/Chat/ChatWrapper";
import Icon from "./components/Icon/Icon";
import Translate from "react-translate-component";

require("./components/Utility/Prototypes"); // Adds a .equals method to Array for use in shouldComponentUpdate

// require("dl_cli_index").init(window) // Adds some object refs to the global window object

let history = createBrowserHistory({queryKey: false});
ChainStore.setDispatchFrequency(20);

class App extends React.Component {

    constructor() {
        super();
        this.state = {
            loading: true,
            synced: false,
            syncFail: false,
            theme: SettingsStore.getState().settings.get("themes"),
            disableChat: SettingsStore.getState().settings.get("disableChat", true),
            showChat: SettingsStore.getState().viewSettings.get("showChat", false),
            isMobile: false
        };
    }

    componentWillUnmount() {
        NotificationStore.unlisten(this._onNotificationChange);
        SettingsStore.unlisten(this._onSettingsChange);
    }

    componentDidMount() {
        try {
            NotificationStore.listen(this._onNotificationChange.bind(this));
            SettingsStore.listen(this._onSettingsChange.bind(this));

            ChainStore.init().then(() => {
                this.setState({synced: true});

                Promise.all([
                    AccountStore.loadDbData(Apis.instance().chainId)
                ]).then(() => {
                    AccountStore.tryToSetCurrentAccount();
                    this.setState({loading: false, syncFail: false});
                }).catch(error => {
                    console.log("[App.jsx] ----- ERROR ----->", error);
                    this.setState({loading: false});
                });
            }).catch(error => {
                console.log("[App.jsx] ----- ChainStore.init error ----->", error);
                let syncFail = error.message === "ChainStore sync error, please check your system clock" ? true : false;
                this.setState({loading: false, syncFail});
            });
        } catch(e) {
            console.error("e:", e);
        }
        const user_agent = navigator.userAgent.toLowerCase();
        if (!(window.electron || user_agent.indexOf("firefox") > -1 || user_agent.indexOf("chrome") > -1 || user_agent.indexOf("edge") > -1)) {
            this.refs.browser_modal.show();
        }

        // Check for mobile device to disable chat
        let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (/android|ipad|ios|iphone|windows phone/i.test(user_agent) || isSafari) {
            this.setState({
                isMobile: true
            });
        }

        this.props.history.listen(() => {
            this._rebuildTooltips();
        });

        this._rebuildTooltips();
    }

    _rebuildTooltips() {
        if (this.refs.tooltip) {
            this.refs.tooltip.globalRebuild();
        }
    }

    /** Usage: NotificationActions.[success,error,warning,info] */
    _onNotificationChange() {
        let notification = NotificationStore.getState().notification;
        if (notification.autoDismiss === void 0) {
            notification.autoDismiss = 10;
        }
        if (this.refs.notificationSystem) this.refs.notificationSystem.addNotification(notification);
    }

    _onSettingsChange() {
        let {settings, viewSettings} = SettingsStore.getState();
        if (settings.get("themes") !== this.state.theme) {
            this.setState({
                theme: settings.get("themes")
            });
        }
        if (settings.get("disableChat") !== this.state.disableChat) {
            this.setState({
                disableChat: settings.get("disableChat")
            });
        }

        if (viewSettings.get("showChat") !== this.state.showChat) {
            this.setState({
                showChat: viewSettings.get("showChat")
            });
        }

    }

    // /** Non-static, used by passing notificationSystem via react Component refs */
    // _addNotification(params) {
    //     console.log("add notification:", this.refs, params);
    //     this.refs.notificationSystem.addNotification(params);
    // }

    render() {
        let {disableChat, isMobile, showChat} = this.state;

        let content = null;

        let showFooter = this.props.location.pathname.indexOf("market") === -1;

        if (this.state.syncFail) {
            content = (
                <div className="grid-frame vertical">
                    <div className="grid-container text-center" style={{paddingTop: "5rem"}}>

                        <h2><Translate content="sync_fail.title" /></h2>
                        <br />
                        <p><Translate content="sync_fail.sub_text_1" /></p>
                        <p><Translate content="sync_fail.sub_text_2" /></p>
                        <Icon name="clock" size="5x"/>
                    </div>

                </div>
            );
        } else if (this.state.loading) {
            content = <div className="grid-frame vertical"><LoadingIndicator /></div>;
        } else if (this.props.location.pathname === "/init-error") {
            content = <div className="grid-frame vertical">{this.props.children}</div>;
        } else {
            content = (
                <div className="grid-frame vertical">
                    <Header/>
                    <MobileMenu isUnlocked={this.state.isUnlocked} id="mobile-menu"/>
                    <div className="grid-block">
                        <div className="grid-block vertical">
                            {this.props.children}
                        </div>
                        <div className="grid-block shrink" style={{overflow: "hidden"}}>
                            {isMobile ? null : <Chat showChat={showChat} disable={disableChat} footerVisible={showFooter}/>}

                        </div>
                    </div>
                    {showFooter ? <Footer synced={this.state.synced}/> : null}
                    <ReactTooltip ref="tooltip" place="top" type="dark" effect="solid"/>
                </div>
            );
        }
        return (
            <div style={{backgroundColor: !this.state.theme ? "#2a2a2a" : null}} className={this.state.theme}>
                <div id="content-wrapper">
                    {content}
                    <NotificationSystem ref="notificationSystem" allowHTML={true}/>
                    <TransactionConfirm/>
                    <WalletUnlockModal/>
                    <BrowserSupportModal ref="browser_modal"/>
                </div>
            </div>
        );

    }
}

@connectToStores
class RootIntl extends React.Component {
    static getStores() {
        return [IntlStore];
    };

    static getPropsFromStores() {
        return {
            locale: IntlStore.getState().currentLocale
        };
    };

    componentDidMount() {
        IntlActions.switchLocale(this.props.locale);
    }

    render() {

        return (
            <IntlProvider
                locale={this.props.locale.replace(/cn/, "zh")}
                formats={intlData.formats}
                initialNow={Date.now()}
            >
                <App {...this.props}/>
            </IntlProvider>
        );
    }
}

class Auth extends React.Component {
    render() {return null; }
}

let willTransitionTo = (nextState, replaceState, callback) => {

    let connectionString = SettingsStore.getSetting("connection");

    if (nextState.location.pathname === "/init-error") {

        return Apis.reset(connectionString, true).init_promise
        .then(() => {
            var db = iDB.init_instance(window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB).init_promise;
            return db.then(() => {
                return callback();
            }).catch((err) => {
                console.log("err:", err);
                return callback();
            });
        }).catch((err) => {
            console.log("err:", err);
            return callback();
        });

    }
    Apis.instance(connectionString, true).init_promise.then((chainId) => {
        console.log("chainId:", chainId);
        var db;
        try {
            db = iDB.init_instance(window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB).init_promise;
        } catch(err) {
            console.log("db init error:", err);
        }
        return Promise.all([db]).then(() => {
            console.log("db init done");
            return Promise.all([
                PrivateKeyActions.loadDbData().then(()=>AccountRefsStore.loadDbData()),
                WalletDb.loadDbData().then(() => {
                    if (!WalletDb.getWallet() && nextState.location.pathname !== "/create-account") {
                        replaceState(null, "/create-account");
                    }
                    if (nextState.location.pathname.indexOf("/auth/") === 0) {
                        replaceState(null, "/dashboard");
                    }
                }).catch((error) => {
                    console.error("----- WalletDb.willTransitionTo error ----->", error);
                }),
                WalletManagerStore.init()
            ]).then(()=> {
                callback();
            });
        });
    }).catch( error => {
        console.error("----- App.willTransitionTo error ----->", error, (new Error).stack);
        if(error.name === "InvalidStateError") {
            alert("Can't access local storage.\nPlease make sure your browser is not in private/incognito mode.");
        } else {
            replaceState(null, "/init-error");
            callback();
        }
    });
};

let routes = (
    <Route path="/" component={RootIntl} onEnter={willTransitionTo}>
        <IndexRoute component={DashboardContainer}/>
        <Route path="/auth/:data" component={Auth}/>
        <Route path="/dashboard" component={DashboardContainer}/>
        <Route path="explorer" component={Explorer}/>
        <Route path="/explorer/fees" component={FeesContainer}/>
        <Route path="/explorer/blocks" component={Blocks}/>
        <Route path="/explorer/assets" component={Assets}/>
        <Route path="/explorer/accounts" component={AccountsContainer}/>
        <Route path="/explorer/witnesses" component={Witnesses}>
            <IndexRoute component={Witnesses}/>
        </Route>
        <Route path="/explorer/committee-members" component={CommitteeMembers}>
            <IndexRoute component={CommitteeMembers}/>
        </Route>
        <Route path="wallet" component={WalletManager}>
            {/* wallet management console */}
            <IndexRoute component={WalletOptions}/>
            <Route path="change" component={ChangeActiveWallet}/>
            <Route path="change-password" component={WalletChangePassword}/>
            <Route path="import-keys" component={ImportKeys}/>
            <Route path="brainkey" component={Brainkey}/>
            <Route path="create" component={WalletCreate}/>
            <Route path="delete" component={WalletDelete}/>
            <Route path="backup/restore" component={BackupRestore}/>
            <Route path="backup/create" component={BackupCreate}/>
            <Route path="backup/brainkey" component={BackupBrainkey}/>
            <Route path="balance-claims" component={BalanceClaimActive}/>
        </Route>
        <Route path="create-wallet" component={WalletCreate}/>
        <Route path="transfer" component={Transfer}/>
        <Route path="invoice/:data" component={Invoice}/>
        <Route path="explorer/markets" component={Markets}/>
        <Route path="market/:marketID" component={Exchange}/>
        <Route path="settings" component={Settings}/>
        <Route path="block/:height" component={BlockContainer}/>
        <Route path="asset/:symbol" component={AssetContainer}/>
        <Route path="create-account" component={CreateAccount}/>
        <Route path="existing-account" component={ExistingAccount}>
            <IndexRoute component={BackupRestore}/>
            <Route path="import-backup" component={ExistingAccountOptions}/>
            <Route path="import-keys" component={ImportKeys}/>
            <Route path="brainkey" component={Brainkey}/>
            <Route path="balance-claim" component={BalanceClaimActive}/>
        </Route>
        <Route path="/account/:account_name" component={AccountPage}>
            <IndexRoute component={AccountOverview}/>
            <Route path="overview" component={AccountOverview}/>
            <Route path="assets" component={AccountAssets}/>
            <Route path="create-asset" component={AccountAssetCreate}/>
            <Route path="update-asset/:asset" component={AccountAssetUpdate}/>
            <Route path="member-stats" component={AccountMembership}/>
            <Route path="vesting" component={AccountVesting}/>
            <Route path="permissions" component={AccountPermissions}/>
            <Route path="voting" component={AccountVoting}/>
            <Route path="deposit-withdraw" component={AccountDepositWithdraw}/>
            <Route path="orders" component={AccountOrders}/>
            <Route path="whitelist" component={AccountWhitelist}/>
        </Route>
        <Route path="deposit-withdraw" component={AccountDepositWithdraw}/>
        <Route path="/init-error" component={InitError}/>
        <Route path="/help" component={Help}>
            <Route path=":path1" component={Help}>
                <Route path=":path2" component={Help}>
                    <Route path=":path3" component={Help}/>
                </Route>
            </Route>
        </Route>
    </Route>
);


ReactDOM.render(<Router history={history} routes={routes}/>, document.getElementById("content"));
