import React from "react";
import {Apis} from "graphenejs-ws";

import { Router, Route, IndexRoute, browserHistory, hashHistory } from "react-router/es";
import App from "./App";

// Stores
import iDB from "idb-instance";
import AccountRefsStore from "stores/AccountRefsStore";
import WalletManagerStore from "stores/WalletManagerStore";
import WalletDb from "stores/WalletDb";
import SettingsStore from "stores/SettingsStore";

// Actions
import PrivateKeyActions from "actions/PrivateKeyActions";

// Components imported here for react hot loader (does not work with async route loading)
import DashboardContainer from "./components/Dashboard/DashboardContainer";
import Witnesses from "./components/Explorer/Witnesses";
import CommitteeMembers from "./components/Explorer/CommitteeMembers";
import FeesContainer from "./components/Blockchain/FeesContainer";
import BlocksContainer from "./components/Explorer/BlocksContainer";
import AssetsContainer from "./components/Explorer/AssetsContainer";
import AccountsContainer from "./components/Explorer/AccountsContainer";
import Explorer from "components/Explorer/Explorer";
import AccountPage from "./components/Account/AccountPage";
import AccountOverview from "./components/Account/AccountOverview";
import AccountAssets from "./components/Account/AccountAssets";
import {AccountAssetCreate} from "./components/Account/AccountAssetCreate";
import AccountAssetUpdate from "./components/Account/AccountAssetUpdate";
import AccountMembership from "./components/Account/AccountMembership";
import AccountVesting from "./components/Account/AccountVesting";
import AccountDepositWithdraw from "./components/Account/AccountDepositWithdraw";
import AccountPermissions from "./components/Account/AccountPermissions";
import AccountWhitelist from "./components/Account/AccountWhitelist";
import AccountVoting from "./components/Account/AccountVoting";
import AccountOrders from "./components/Account/AccountOrders";
import ExchangeContainer from "./components/Exchange/ExchangeContainer";
import MarketsContainer from "./components/Exchange/MarketsContainer";
import Transfer from "./components/Transfer/Transfer";
import SettingsContainer from "./components/Settings/SettingsContainer";
import BlockContainer from "./components/Blockchain/BlockContainer";
import AssetContainer from "./components/Blockchain/AssetContainer";
import CreateAccount from "./components/Account/CreateAccount";
import {ExistingAccount, ExistingAccountOptions} from "./components/Wallet/ExistingAccount";
import WalletCreate from "./components/Wallet/WalletCreate";
import ImportKeys from "./components/Wallet/ImportKeys";
import Invoice from "./components/Transfer/Invoice";
import {BackupCreate, BackupRestore} from "./components/Wallet/Backup";
import WalletChangePassword from "./components/Wallet/WalletChangePassword";
import {WalletManager, WalletOptions, ChangeActiveWallet, WalletDelete} from "./components/Wallet/WalletManager";
import BalanceClaimActive from "./components/Wallet/BalanceClaimActive";
import BackupBrainkey from "./components/Wallet/BackupBrainkey";
import Brainkey from "./components/Wallet/Brainkey";
import Help from "./components/Help";
import InitError from "./components/InitError";

/*
* Electron does not support browserHistory, so we need to use hashHistory
*/
const history = __ELECTRON__ ? hashHistory : browserHistory;

class Auth extends React.Component {
    render() {return null; }
}

const willTransitionTo = (nextState, replaceState, callback) => {
    let connectionString = SettingsStore.getSetting("apiServer");

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
    Apis.instance(connectionString, true).init_promise.then(() => {
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
                    if (!WalletDb.getWallet() && nextState.location.pathname === "/") {
                        replaceState("/create-account");
                    }
                    if (nextState.location.pathname.indexOf("/auth/") === 0) {
                        replaceState("/dashboard");
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
            if (__ELECTRON__) {
                replaceState("/dashboard");
            } else {
                alert("Can't access local storage.\nPlease make sure your browser is not in private/incognito mode.");
            }
        } else {
            replaceState("/init-error");
            callback();
        }
    });
};

const routes = (
    <Route path="/" component={App} onEnter={willTransitionTo}>
        <IndexRoute component={DashboardContainer}/>
        <Route path="/auth/:data" component={Auth}/>
        <Route path="/dashboard" component={DashboardContainer}/>
        <Route path="explorer" component={Explorer}/>
        <Route path="/explorer/fees" component={FeesContainer} />
        <Route path="/explorer/blocks" component={BlocksContainer} />
        <Route path="/explorer/assets" component={AssetsContainer} />
        <Route path="/explorer/accounts" component={AccountsContainer} />
        <Route path="/explorer/witnesses" component={Witnesses} />
        <Route path="/explorer/committee-members" component={CommitteeMembers} />

        <Route path="wallet" component={WalletManager} >
            {/* wallet management console */}
            <IndexRoute component={WalletOptions} />
            <Route path="change" component={ChangeActiveWallet} />
            <Route path="change-password" component={WalletChangePassword} />
            <Route path="import-keys" component={ImportKeys} />
            <Route path="brainkey" component={ExistingAccountOptions} />
            <Route path="create" component={WalletCreate} />
            <Route path="delete" component={WalletDelete} />
            <Route path="backup/restore" component={BackupRestore} />
            <Route path="backup/create" component={BackupCreate} />
            <Route path="backup/brainkey" component={BackupBrainkey} />
            <Route path="balance-claims" component={BalanceClaimActive} />
        </Route>

        <Route path="create-wallet" component={WalletCreate} />

        <Route path="transfer" component={Transfer}/>

        <Route path="invoice/:data" component={Invoice} />
        <Route path="explorer/markets" component={MarketsContainer} />
        <Route path="market/:marketID" component={ExchangeContainer} />
        <Route path="settings" component={SettingsContainer} />
        <Route path="block/:height" component={BlockContainer} />
        <Route path="asset/:symbol" component={AssetContainer} />
        <Route path="create-account" component={CreateAccount} />

        <Route path="existing-account" component={ExistingAccount} >
            <IndexRoute component={BackupRestore} />
            <Route path="import-backup" component={ExistingAccountOptions} />
            <Route path="import-keys" component={ImportKeys} />
            <Route path="brainkey" component={Brainkey} />
            <Route path="balance-claim" component={BalanceClaimActive} />
        </Route>

        <Route path="/account/:account_name" component={AccountPage} >
            <IndexRoute component={AccountOverview} />
            <Route path="overview" component={AccountOverview} />
            <Route path="assets" component={AccountAssets} />
            <Route path="create-asset" component={AccountAssetCreate} />
            <Route path="update-asset/:asset" component={AccountAssetUpdate} />
            <Route path="member-stats" component={AccountMembership} />
            <Route path="vesting" component={AccountVesting} />
            <Route path="permissions" component={AccountPermissions} />
            <Route path="voting" component={AccountVoting} />
            <Route path="deposit-withdraw" component={AccountDepositWithdraw} />
            <Route path="orders" component={AccountOrders} />
            <Route path="whitelist" component={AccountWhitelist} />
        </Route>

        <Route path="deposit-withdraw" component={AccountDepositWithdraw} />
        <Route path="/init-error" component={InitError} />
        <Route path="/help" component={Help} >
            <Route path=":path1" component={Help} >
                <Route path=":path2" component={Help} >
                    <Route path=":path3" component={Help} />
                </Route>
            </Route>
        </Route>
    </Route>
);

export default class Routes extends React.Component {
    render() {
        return <Router history={history} routes={routes} />;
    }
}
