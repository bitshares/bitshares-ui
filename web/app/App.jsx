import React from "react";
import Router from "react-router";
import IntlStore from "stores/IntlStore"; // This needs to be initalized here even though IntlStore is never used
import Apis from "rpc_api/ApiInstances";
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
import AccountDepositWithdraw from "./components/Account/AccountDepositWithdraw";
import AccountPayees from "./components/Account/AccountPayees";
import AccountPermissions from "./components/Account/AccountPermissions";
import AccountVoting from "./components/Account/AccountVoting";
import AccountOrders from "./components/Account/AccountOrders";
import Exchange from "./components/Exchange/ExchangeContainer";
import Markets from "./components/Exchange/MarketsContainer";
import Transfer from "./components/Transfer/Transfer";
import Settings from "./components/Settings/SettingsContainer";
import BlockContainer from "./components/Blockchain/BlockContainer";
import AssetContainer from "./components/Blockchain/AssetContainer";
import Transaction from "./components/Blockchain/Transaction";
import CreateAccount from "./components/Account/CreateAccount";
import AccountStore from "stores/AccountStore";
import IntlActions from "actions/IntlActions";
import MobileMenu from "components/Layout/MobileMenu";
import LoadingIndicator from "./components/LoadingIndicator";
import TransactionConfirm from "./components/Blockchain/TransactionConfirm";
import WalletUnlockModal from "./components/Wallet/WalletUnlockModal"
import NotificationSystem from "react-notification-system";
import NotificationStore from "stores/NotificationStore";
import cookies from "cookies-js";
import iDB from "idb-instance";
import ExistingAccount, {ExistingAccountOptions} from "./components/Wallet/ExistingAccount";
import WalletCreate from "./components/Wallet/WalletCreate";
import ImportKeys from "./components/Wallet/ImportKeys";
import WalletDb from "stores/WalletDb";
import PrivateKeyActions from "actions/PrivateKeyActions";
import Console from "./components/Console/Console";
import ReactTooltip from "react-tooltip";
import Invoice from "./components/Transfer/Invoice";
import ChainStore from "api/ChainStore";
import Backup, {BackupCreate, BackupVerify, BackupRestore} from "./components/Wallet/Backup";
import WalletChangePassword from "./components/Wallet/WalletChangePassword"
import WalletManagerStore from "stores/WalletManagerStore";
import WalletManager, {WalletOptions, ChangeActiveWallet, WalletDelete} from "./components/Wallet/WalletManager";
import BalanceClaimActive from "./components/Wallet/BalanceClaimActive";
import BackupBrainkey from "./components/Wallet/BackupBrainkey";
import Brainkey from "./components/Wallet/Brainkey";
import AccountRefsStore from "stores/AccountRefsStore";
import Help from "./components/Help";
import InitError from "./components/InitError";

require("./components/Utility/Prototypes"); // Adds a .equals method to Array for use in shouldComponentUpdate
require("./assets/stylesheets/app.scss");
require("dl_cli_index").init(window) // Adds some object refs to the global window object

const { Route, RouteHandler, DefaultRoute, Redirect} = Router;

class App extends React.Component {

    static contextTypes = { router: React.PropTypes.func.isRequired }

    constructor() {
        super();
        this.state = {loading: true, synced: false};
    }

    componentWillUnmount() {
        NotificationStore.unlisten(this._onNotificationChange);
    }

    componentDidMount() { try {
        NotificationStore.listen(this._onNotificationChange.bind(this));

        // Try to retrieve locale from cookies
        let locale;
        if (cookies) {
            locale = cookies.get("graphene_locale");
        }
        // Switch locale if the user has already set a different locale than en
        let localePromise = (locale) ? IntlActions.switchLocale(locale) : null;
        Promise.all([
            localePromise, // Non API
            AccountStore.loadDbData()            
        ]).then(() => {
            AccountStore.tryToSetCurrentAccount();
            this.setState({loading: false});
        }).catch(error => {
            console.log("[App.jsx] ----- ERROR ----->", error, error.stack);
            this.setState({loading: false});
        });

        ChainStore.init().then(() => {
            this.setState({synced: true});
        }).catch(error => {
            console.log("[App.jsx] ----- ChainStore.init error ----->", error, error.stack);
            this.setState({loading: false});
        });
    } catch(e) { console.error(e) }}

    /** Usage: NotificationActions.[success,error,warning,info] */
    _onNotificationChange() {
        let notification = NotificationStore.getState().notification;
        if (notification.autoDismiss === void 0) {
            notification.autoDismiss = 10;
        }
        this.refs.notificationSystem.addNotification(notification);
    }

    // /** Non-static, used by passing notificationSystem via react Component refs */
    // _addNotification(params) {
    //     console.log("add notification:", this.refs, params);
    //     this.refs.notificationSystem.addNotification(params);
    // }

    render() {

        if (this.context.router.getCurrentPath() === "/init-error") { // temporary, until we implement right offline mode
            return (
                <div className="grid-frame vertical">
                    <div className="grid-block vertical">
                        <InitError />
                    </div>
                </div>
            );
        }
        let content = null;
        if (this.state.loading) {
            content = <LoadingIndicator />;
        } else {
            content = (
                <div className="grid-frame vertical">
                    <Header/>
                    <MobileMenu isUnlocked={this.state.isUnlocked} id="mobile-menu"/>

                    <div className="grid-block vertical">
                        <RouteHandler />
                    </div>
                    <Footer synced={this.state.synced}/>
                    <ReactTooltip place="top" type="dark" effect="solid"/>
                </div>
            );
        }
        return (
            <div>
                {content}
                <NotificationSystem ref="notificationSystem" allowHTML={true}/>
                <TransactionConfirm/>
                <WalletUnlockModal/>
            </div>
        );

    }
}

class Auth extends React.Component {
    render() {return null; }
}

App.willTransitionTo = (transition, params, query, callback) => {
    if (transition.path === "/init-error") {
        var db = iDB.init_instance(window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB).init_promise
        db.then(() => {
            Apis.instance().init_promise.then(() => callback()).catch(() => callback());
        });
        return;
    }
    Apis.instance().init_promise.then(() => {
        var db = iDB.init_instance(window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB).init_promise
        return Promise.all([db]).then(() => {
            console.log("db init done");
            return Promise.all([
                PrivateKeyActions.loadDbData().then(()=>AccountRefsStore.loadDbData()),
                WalletDb.loadDbData().then(() => {
                    if (!WalletDb.getWallet() && transition.path !== "/create-account") {
                        transition.redirect("/create-account");
                    }
                    if (transition.path.indexOf("/auth/") === 0) {
                        transition.redirect("/dashboard");
                    }
                }).catch((error) => {
                    console.error("----- WalletDb.willTransitionTo error ----->", error);
                }),
                WalletManagerStore.init()
            ]).then(()=> {
                callback();
            })
        });
    }).catch( error => {
        console.error("----- App.willTransitionTo error ----->", error, (new Error).stack);
        if(error.name === "InvalidStateError") {
            alert("Can't access local storage.\nPlease make sure your browser is not in private/incognito mode.");
        } else {
            transition.redirect("/init-error");
            callback();
        }
    })
};

let routes = (
    <Route handler={App}>
        <DefaultRoute handler={DashboardContainer}/>
        <Route name="auth" path="/auth/:data" handler={Auth}/>
        <Route name="dashboard" path="/dashboard" handler={DashboardContainer}/>
        <Route name="explorer" path="/explorer" handler={Explorer}/>
        <Route name="blocks" path="/explorer/blocks" handler={Blocks}/>
        <Route name="assets" path="/explorer/assets" handler={Assets}/>
        <Route name="accounts" path="/explorer/accounts" handler={AccountsContainer}/>
        <Route name="witnesses" path="/explorer/witnesses" handler={Witnesses}>
            <DefaultRoute handler={Witnesses}/>
        </Route>
        <Route name="committee-members" path="/explorer/committee-members" handler={CommitteeMembers}>
            <DefaultRoute handler={CommitteeMembers}/>
        </Route>
        <Route name="wallet" path="wallet" handler={WalletManager}>
            {/* wallet management console */}
            <DefaultRoute handler={WalletOptions}/>
            <Route name="wmc-change-wallet" path="change" handler={ChangeActiveWallet}/>
            <Route name="wmc-change-password" path="change-password" handler={WalletChangePassword}/>
            <Route name="wmc-import-keys" path="import-keys" handler={ImportKeys}/>
            <Route name="wmc-brainkey" path="brainkey" handler={Brainkey}/>
            <Route name="wmc-wallet-create" path="create" handler={WalletCreate}/>
            <Route name="wmc-wallet-delete" path="delete" handler={WalletDelete}/>
            <Route name="wmc-backup-verify-restore" path="backup/restore" handler={BackupRestore}/>
            <Route name="wmc-backup-create" path="backup/create" handler={BackupCreate}/>
            <Route name="wmc-backup-brainkey" path="backup/brainkey" handler={BackupBrainkey}/>
            <Route name="wmc-balance-claims" path="balance-claims" handler={BalanceClaimActive}/>
        </Route>
        <Route name="create-wallet" path="create-wallet" handler={WalletCreate}/>
        <Route name="console" path="console" handler={Console}/>
        <Route name="transfer" path="transfer" handler={Transfer}/>
        <Route name="invoice" path="invoice/:data" handler={Invoice}/>
        <Redirect from="markets" to="markets"/>
        <Route name="markets" path="explorer/markets" handler={Markets}/>
        <Redirect from="exchange/trade/:marketID" to="exchange"/>
        <Route name="exchange" path="market/:marketID" handler={Exchange}/>
        <Route name="settings" path="settings" handler={Settings}/>
        <Route name="block" path="block/:height" handler={BlockContainer}/>
        <Route name="asset" path="asset/:symbol" handler={AssetContainer}/>
        <Route name="tx" path="tx" handler={Transaction}/>
        <Route name="create-account" path="create-account" handler={CreateAccount}/>
        <Route name="existing-account" path="existing-account" handler={ExistingAccount}>
            <DefaultRoute handler={ExistingAccountOptions}/>
            <Route name="welcome-import-backup" path="import-backup" handler={BackupRestore}/>
            <Route name="welcome-import-keys" path="import-keys" handler={ImportKeys}/>
            <Route name="welcome-brainkey" path="brainkey" handler={Brainkey}/>
            <Route name="welcome-balance-claim" path="balance-claim" handler={BalanceClaimActive}/>
        </Route>
        <Route name="account" path="/account/:account_name" handler={AccountPage}>
            <DefaultRoute handler={AccountOverview}/>
            <Route name="account-overview" path="overview" handler={AccountOverview}/>
            <Route name="account-assets" path="assets" handler={AccountAssets}/>
            <Route name="account-create-asset" path="create-asset" handler={AccountAssetCreate}/>
            <Route name="account-update-asset" path="update-asset/:asset" handler={AccountAssetUpdate}/>

            <Route name="account-member-stats" path="member-stats" handler={AccountMembership}/>
            <Route name="account-payees" path="payees" handler={AccountPayees}/>
            <Route name="account-permissions" path="permissions" handler={AccountPermissions}/>
            <Route name="account-voting" path="voting" handler={AccountVoting}/>
            <Route name="account-deposit-withdraw" path="deposit-withdraw" handler={AccountDepositWithdraw}/>
            <Route name="account-orders" path="orders" handler={AccountOrders}/>
        </Route>
        <Route name="init-error" path="/init-error" handler={InitError}/>
        <Route name="help" path="/help" handler={Help}>
            <Route name="path1" path=":path1" handler={Help}>
                <Route name="path2" path=":path2" handler={Help}>
                    <Route name="path3" path=":path3" handler={Help}/>
                </Route>
            </Route>
        </Route>
    </Route>
);


Router.run(routes, Handler => {
    React.render(<Handler/>, document.getElementById("content"));
});

