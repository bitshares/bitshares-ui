import React from "react";
import Router from "react-router";

const { Route, RouteHandler, DefaultRoute } = Router;

import IntlStore from "stores/IntlStore"; // This needs to be initalized here even though IntlStore is never used
import Apis from "rpc_api/ApiInstances";
import DashboardContainer from "./components/Dashboard/DashboardContainer";
import Explorer from "./components/Explorer/Explorer";
import Blocks from "./components/Explorer/BlocksContainer";
import Assets from "./components/Explorer/AssetsContainer";
import AccountsContainer from "./components/Explorer/AccountsContainer";
import WitnessesContainer from "./components/Explorer/WitnessesContainer";
import Witnesses from "./components/Explorer/Witnesses";
import Witness from "./components/Explorer/Witness";
import DelegatesContainer from "./components/Explorer/DelegatesContainer";
import Delegates from "./components/Explorer/Delegates";
import Delegate from "./components/Explorer/Delegate";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import AccountPage from "./components/Account/AccountPage";
import AccountOverview from "./components/Account/AccountOverview";
import AccountUserIssuedAssets from "./components/Account/AccountUserIssuedAssets";
import AccountMemberStats from "./components/Account/AccountMemberStats";
import AccountHistory from "./components/Account/AccountHistory";
import AccountPayees from "./components/Account/AccountPayees";
import AccountPermissions from "./components/Account/AccountPermissions";
import AccountVoting from "./components/Account/AccountVoting";
import AccountOrders from "./components/Account/AccountOrders";
import Exchange from "components/Exchange/ExchangeContainer";
import Markets from "components/Exchange/MarketsContainer";
import TransferPage from "./components/Transfer/TransferPage";
import Settings from "./components/Settings/SettingsContainer";
import Logout from "./components/Logout";
import Login from "./components/Login";
import BlockContainer from "./components/Blockchain/BlockContainer";
import Asset from "./components/Blockchain/AssetContainer";
import Transaction from "./components/Blockchain/Transaction";
import CreateAccount from "./components/CreateAccount";
import BaseComponent from "./components/BaseComponent";
import SessionStore from "stores/SessionStore";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import AssetActions from "actions/AssetActions";
import BlockchainActions from "actions/BlockchainActions";
import IntlActions from "actions/IntlActions";
import MobileMenu from "./components/Header/MobileMenu";
import LoadingIndicator from "./components/LoadingIndicator/LoadingIndicator";
import AccountNotifications from "./components/Notifier/NotifierContainer";
import NotificationSystem from "react-notification-system";
import NotificationStore from "stores/NotificationStore";
import cookies from "cookies-js";
import iDB from "idb-instance";

import ExistingAccount from "./components/Wallet/ExistingAccount";
import Wallet from "./components/Wallet/Wallet";
import WalletCreate from "./components/Wallet/WalletCreate";
import ImportKeys from "./components/Wallet/ImportKeys";
import WalletDb from "stores/WalletDb";
import PrivateKeyStore from "stores/PrivateKeyStore";
import Console from "./components/Console/Console";
import ReactTooltip from "react-tooltip";
import Invoice from "./components/Transfer/Invoice";

require("./components/Utility/Prototypes"); // Adds a .equals method to Array for use in shouldComponentUpdate
require("./assets/loader");


class App extends BaseComponent {
    
    constructor(props) {
        super(props, SessionStore);
        this.state.loading = true;
    }
    
    componentWillUnmount() {
        NotificationStore.unlisten(this._onNotificationChange);
    }
    
    componentDidMount() {
        NotificationStore.listen(this._onNotificationChange.bind(this));
        
        let locale;
        if (cookies) {
            locale = cookies.get("graphene_locale");
            // console.log("cookie locale:", locale);
        }

        Apis.instance().init_promise.then(() => {
            let idb_promise = iDB.init_instance(indexedDB).init_promise;
            let localePromise = (locale) ? IntlActions.switchLocale(locale) : null;
            return Promise.all([
                AccountActions.getAllAccounts(),
                AccountActions.getAccount("nathan"),
                AssetActions.getAsset("1.3.0"),
                AssetActions.getAssetList("A", 100),
                BlockchainActions.subscribeGlobals(),
                localePromise,
                idb_promise
            ]);
        }).then( () => {
            return Promise.all([
                AccountStore.loadDbData(),
                WalletDb.loadDbData(),
                PrivateKeyStore.loadDbData()
            ]);
        }).then(() => {
            AccountStore.tryToSetCurrentAccount();
            this.setState({loading: false});
        }).catch(error => {
            console.log("[App.jsx] ----- ERROR ----->", error, error.stack);
            this.setState({loading: false});
        });
    }
    
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
        let content = (
            <div className="grid-frame vertical">
                <Header isUnlocked={this.state.isUnlocked}/>
                <MobileMenu isUnlocked={this.state.isUnlocked} id="mobile-menu"/>
                <AccountNotifications/>
                <div className="grid-block vertical">
                    <RouteHandler />
                </div>
                <Footer/>
                <ReactTooltip type="dark" effect="solid" />
            </div>
        );
        if (this.state.loading) {
            content = <LoadingIndicator />;
        } 
        return (
            <div>
                {content}
                <NotificationSystem ref="notificationSystem" allowHTML={true}/>
            </div>
        );
        
    }
}

let routes = (
    <Route handler={App}>
        <Route name="dashboard" path="/dashboard" handler={DashboardContainer}/>
        <Route name="explorer" path="/explorer" handler={Explorer}/>
        <Route name="blocks" path="/explorer/blocks" handler={Blocks}/>
        <Route name="assets" path="/explorer/assets" handler={Assets}/>
        <Route name="accounts" path="/explorer/accounts" handler={AccountsContainer}/>
        <Route name="witnesses" path="/explorer/witnesses" handler={WitnessesContainer}>
            <DefaultRoute handler={Witnesses}/>
            <Route name="witness" path=":name" handler={Witness} />
        </Route>
        <Route name="delegates" path="/explorer/delegates" handler={DelegatesContainer}>
            <DefaultRoute handler={Delegates}/>
            <Route name="delegate" path=":name" handler={Delegate} />
        </Route>
        <Route name="wallet" path="wallet" handler={Wallet}/>
        <Route name="create-wallet" path="create-wallet" handler={WalletCreate}/>
        <Route name="console" path="console" handler={Console}/>
        <Route name="transfer" path="transfer" handler={TransferPage}/>
        <Route name="invoice" path="invoice/:data" handler={Invoice}/>
        <Route name="markets" path="markets" handler={Markets}/>
        <Route name="exchange" path="exchange/trade/:marketID" handler={Exchange}/>
        <Route name="settings" path="settings" handler={Settings}/>
        <Route name="logout" path="logout" handler={Logout}/>
        <Route name="login" path="login" handler={Login}/>
        <Route name="block" path="block/:height" handler={BlockContainer}/>
        <Route name="asset" path="asset/:symbol" handler={Asset}/>
        <Route name="tx" path="tx" handler={Transaction}/>
        <Route name="create-account" path="create-account" handler={CreateAccount}/>
        <Route name="existing-account" path="existing-account" handler={ExistingAccount}/>
        <Route name="import-keys" path="import-keys" handler={ImportKeys}/>
        <Route name="account" path="/account/:name" handler={AccountPage}>
            <Route name="account-overview" path="overview" handler={AccountOverview}/>
            <Route name="account-assets" path="user-issued-assets" handler={AccountUserIssuedAssets}/>
            <Route name="account-member-stats" path="member-stats" handler={AccountMemberStats}/>
            <Route name="account-history" path="history" handler={AccountHistory}/>
            <Route name="account-payees" path="payees" handler={AccountPayees}/>
            <Route name="account-permissions" path="permissions" handler={AccountPermissions}/>
            <Route name="account-voting" path="voting" handler={AccountVoting}/>
            <Route name="account-orders" path="orders" handler={AccountOrders}/>
            <DefaultRoute handler={AccountOverview}/>
        </Route>
        <DefaultRoute handler={DashboardContainer}/>
    </Route>
);


Router.run(routes, function (Handler) {
    React.render(<Handler/>, document.getElementById("content"));
});
