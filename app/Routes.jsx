import React from "react";

import {Route, IndexRoute, Redirect} from "react-router/es";
import willTransitionTo from "./routerTransition";
import App from "./App";

/*
* Electron does not support async loading of components via System.import,
* so we make sure they're bundled already by including them here
*/
if (__ELECTRON__ || __HASH_HISTORY__) {
    require("./electron_imports");
}

class Auth extends React.Component {
    render() {
        return null;
    }
}

function loadRoute(cb, moduleName = "default") {
    return module => cb(null, module[moduleName]);
}

function errorLoading(err) {
    console.error("Dynamic page loading failed", err);
}

const routes = (
    <Route path="/" component={App} onEnter={willTransitionTo}>
        <IndexRoute
            getComponent={(location, cb) => {
                import("components/Dashboard/DashboardPage")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route path="/auth/:data" component={Auth} />

        <Route
            path="explorer"
            getComponent={(location, cb) => {
                import("components/Explorer/Explorer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="/explorer/fees"
            getComponent={(location, cb) => {
                import("components/Explorer/FeesContainer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="/explorer/blocks"
            getComponent={(location, cb) => {
                import("components/Explorer/BlocksContainer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="/explorer/assets"
            getComponent={(location, cb) => {
                import("components/Explorer/AssetsContainer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="/explorer/accounts"
            getComponent={(location, cb) => {
                import("components/Explorer/AccountsContainer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="/explorer/witnesses"
            getComponent={(location, cb) => {
                import("components/Explorer/Witnesses")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="/explorer/committee-members"
            getComponent={(location, cb) => {
                import("components/Explorer/CommitteeMembers")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />

        <Route
            path="wallet"
            getComponent={(location, cb) => {
                import("components/Wallet/WalletManager")
                    .then(loadRoute(cb, "WalletManager"))
                    .catch(errorLoading);
            }}
        >
            {/* wallet management console */}
            <IndexRoute
                getComponent={(location, cb) => {
                    import("components/Wallet/WalletManager")
                        .then(loadRoute(cb, "WalletOptions"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="change"
                getComponent={(location, cb) => {
                    import("components/Wallet/WalletManager")
                        .then(loadRoute(cb, "ChangeActiveWallet"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="change-password"
                getComponent={(location, cb) => {
                    import("components/Wallet/WalletChangePassword")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="import-keys"
                getComponent={(location, cb) => {
                    import("components/Wallet/ImportKeys")
                        .then(loadRoute(cb, "ExistingAccountOptions"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="brainkey"
                getComponent={(location, cb) => {
                    import("components/Wallet/Brainkey")
                        .then(loadRoute(cb, "ExistingAccountOptions"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="create"
                getComponent={(location, cb) => {
                    import("components/Wallet/WalletCreate")
                        .then(loadRoute(cb, "WalletCreate"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="delete"
                getComponent={(location, cb) => {
                    import("components/Wallet/WalletManager")
                        .then(loadRoute(cb, "WalletDelete"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="backup/restore"
                getComponent={(location, cb) => {
                    import("components/Wallet/Backup")
                        .then(loadRoute(cb, "BackupRestore"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="backup/create"
                getComponent={(location, cb) => {
                    import("components/Wallet/Backup")
                        .then(loadRoute(cb, "BackupCreate"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="backup/brainkey"
                getComponent={(location, cb) => {
                    import("components/Wallet/BackupBrainkey")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="balance-claims"
                getComponent={(location, cb) => {
                    import("components/Wallet/BalanceClaimActive")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
        </Route>

        <Route
            path="create-wallet"
            getComponent={(location, cb) => {
                import("components/Wallet/WalletCreate")
                    .then(loadRoute(cb, "WalletCreate"))
                    .catch(errorLoading);
            }}
        />

        <Route
            path="create-wallet-brainkey"
            getComponent={(location, cb) => {
                import("components/Wallet/WalletCreate")
                    .then(loadRoute(cb, "CreateWalletFromBrainkey"))
                    .catch(errorLoading);
            }}
        />

        <Route
            path="transfer"
            getComponent={(location, cb) => {
                import("components/Transfer/Transfer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />

        <Route
            path="invoice/:data"
            getComponent={(location, cb) => {
                import("components/Transfer/Invoice")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="explorer/markets"
            getComponent={(location, cb) => {
                import("components/Explorer/MarketsContainer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="market/:marketID"
            getComponent={(location, cb) => {
                import("components/Exchange/ExchangeContainer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="settings"
            getComponent={(location, cb) => {
                import("components/Settings/SettingsContainer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="settings/:tab"
            getComponent={(location, cb) => {
                import("components/Settings/SettingsContainer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="block/:height"
            getComponent={(location, cb) => {
                import("components/Blockchain/BlockContainer")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="asset/:symbol"
            getComponent={(location, cb) => {
                import("components/Blockchain/Asset")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="create-account"
            getComponent={(location, cb) => {
                import("components/LoginSelector")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        >
            <Route
                path="wallet"
                getComponent={(location, cb) => {
                    import("components/Account/CreateAccount")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="password"
                getComponent={(location, cb) => {
                    import("components/Account/CreateAccountPassword")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
        </Route>

        <Route
            path="accounts"
            getComponent={(location, cb) => {
                import("components/Dashboard/DashboardAccountsOnly")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />

        <Route
            path="existing-account"
            getComponent={(location, cb) => {
                import("components/Wallet/ExistingAccount")
                    .then(loadRoute(cb, "ExistingAccount"))
                    .catch(errorLoading);
            }}
        >
            <IndexRoute
                getComponent={(location, cb) => {
                    import("components/Wallet/Backup")
                        .then(loadRoute(cb, "BackupRestore"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="import-backup"
                getComponent={(location, cb) => {
                    import("components/Wallet/ExistingAccount")
                        .then(loadRoute(cb, "ExistingAccountOptions"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="import-keys"
                getComponent={(location, cb) => {
                    import("components/Wallet/ImportKeys")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="brainkey"
                getComponent={(location, cb) => {
                    import("components/Wallet/Brainkey")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="balance-claim"
                getComponent={(location, cb) => {
                    import("components/Wallet/BalanceClaimActive")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
        </Route>

        <Route
            path="/account/:account_name"
            getComponent={(location, cb) => {
                import("components/Account/AccountPage")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        >
            <IndexRoute
                getComponent={(location, cb) => {
                    import("components/Account/AccountOverview")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            {/* <Route path="dashboard" getComponent={(location, cb) => {
                import("components/Account/AccountOverview").then(loadRoute(cb)).catch(errorLoading);
            }}/> */}
            {/* <Route path="deposit-withdraw" getComponent={(location, cb) => {
                import("components/Account/AccountDepositWithdraw").then(loadRoute(cb)).catch(errorLoading);
            }}/> */}
            {/* <Route path="orders" getComponent={(location, cb) => {
                import("components/Account/AccountOrders").then(loadRoute(cb)).catch(errorLoading);
            }}/> */}

            <Route
                path="assets"
                getComponent={(location, cb) => {
                    import("components/Account/AccountAssets")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="create-asset"
                getComponent={(location, cb) => {
                    import("components/Account/AccountAssetCreate")
                        .then(loadRoute(cb, "AccountAssetCreate"))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="update-asset/:asset"
                getComponent={(location, cb) => {
                    import("components/Account/AccountAssetUpdate")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="member-stats"
                getComponent={(location, cb) => {
                    import("components/Account/AccountMembership")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="vesting"
                getComponent={(location, cb) => {
                    import("components/Account/AccountVesting")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="permissions"
                getComponent={(location, cb) => {
                    import("components/Account/AccountPermissions")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="voting"
                getComponent={(location, cb) => {
                    import("components/Account/AccountVoting")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="whitelist"
                getComponent={(location, cb) => {
                    import("components/Account/AccountWhitelist")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Route
                path="signedmessages"
                getComponent={(location, cb) => {
                    import("components/Account/AccountSignedMessages")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            />
            <Redirect from="overview" to="/account/:account_name" />
            <Redirect from="dashboard" to="/account/:account_name" />
            <Redirect from="orders" to="/account/:account_name" />
        </Route>
        <Route
            path="deposit-withdraw"
            getComponent={(location, cb) => {
                import("components/Account/AccountDepositWithdraw")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="create-worker"
            getComponent={(location, cb) => {
                import("components/Account/CreateWorker")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="/init-error"
            getComponent={(location, cb) => {
                import("components/InitError")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="/news"
            getComponent={(location, cb) => {
                import("components/News")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
        <Route
            path="/help"
            getComponent={(location, cb) => {
                import("components/Help")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        >
            <Route
                path=":path1"
                getComponent={(location, cb) => {
                    import("components/Help")
                        .then(loadRoute(cb))
                        .catch(errorLoading);
                }}
            >
                <Route
                    path=":path2"
                    getComponent={(location, cb) => {
                        import("components/Help")
                            .then(loadRoute(cb))
                            .catch(errorLoading);
                    }}
                >
                    <Route
                        path=":path3"
                        getComponent={(location, cb) => {
                            import("components/Help")
                                .then(loadRoute(cb))
                                .catch(errorLoading);
                        }}
                    />
                </Route>
            </Route>
        </Route>
        <Route
            path="*"
            getComponent={(location, cb) => {
                import("components/Page404/Page404")
                    .then(loadRoute(cb))
                    .catch(errorLoading);
            }}
        />
    </Route>
);

export default routes;
