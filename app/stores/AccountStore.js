import BaseStore from "./BaseStore";
import Immutable from "immutable";
import alt from "alt-instance";
import AccountActions from "actions/AccountActions";
import SettingsActions from "actions/SettingsActions";
import WalletActions from "actions/WalletActions";
import iDB from "idb-instance";
import PrivateKeyStore from "./PrivateKeyStore";
import {ChainStore, ChainValidation, FetchChain} from "bitsharesjs/es";
import {Apis} from "bitsharesjs-ws";
import AccountRefsStore from "stores/AccountRefsStore";
import AddressIndex from "stores/AddressIndex";
import ls from "common/localStorage";

let accountStorage = new ls("__graphene__");

/**
 *  This Store holds information about accounts in this wallet
 *
 */

class AccountStore extends BaseStore {
    constructor() {
        super();

        this.bindListeners({
            onSetCurrentAccount: AccountActions.setCurrentAccount,
            onCreateAccount: AccountActions.createAccount,
            onAccountSearch: AccountActions.accountSearch,
            tryToSetCurrentAccount: AccountActions.tryToSetCurrentAccount,
            onSetPasswordAccount: AccountActions.setPasswordAccount,
            onChangeSetting: SettingsActions.changeSetting,
            onSetWallet: WalletActions.setWallet,
            onAddStarAccount: AccountActions.addStarAccount,
            onRemoveStarAccount: AccountActions.removeStarAccount,
            onAddAccountContact: AccountActions.addAccountContact,
            onRemoveAccountContact: AccountActions.removeAccountContact,
            onToggleHideAccount: AccountActions.toggleHideAccount
            // onNewPrivateKeys: [ PrivateKeyActions.loadDbData, PrivateKeyActions.addKey ]
        });

        this._export(
            "loadDbData",
            "tryToSetCurrentAccount",
            "onCreateAccount",
            "getMyAccounts",
            "isMyAccount",
            "getMyAuthorityForAccount",
            "isMyKey",
            "reset",
            "setWallet"
        );

        const referralAccount = this._checkReferrer();
        this.state = {
            subbed: false,
            myActiveAccounts: Immutable.Set(), // accounts for which the user controls the keys and are visible
            myHiddenAccounts: Immutable.Set(), // accounts for which the user controls the keys that have been 'hidden' in the settings
            currentAccount: null, // the currently selected account, subset of starredAccounts
            passwordAccount: null, // passwordAccount is the account used when logging in with cloud mode
            starredAccounts: Immutable.Map(), // starred accounts are 'active' accounts that can be selected using the right menu dropdown for trading/transfers etc
            searchAccounts: Immutable.Map(),
            accountContacts: Immutable.Set(),
            linkedAccounts: Immutable.Set(), // linkedAccounts are accounts for which the user controls the private keys, which are stored in a db with the wallet and automatically loaded every time the app starts
            referralAccount
        };

        this.getMyAccounts = this.getMyAccounts.bind(this);
        this.chainStoreUpdate = this.chainStoreUpdate.bind(this);
        this._getStorageKey = this._getStorageKey.bind(this);
        this.setWallet = this.setWallet.bind(this);
    }

    _migrateUnfollowedAccounts(state) {
        try {
            let unfollowed_accounts = accountStorage.get(
                "unfollowed_accounts",
                []
            );
            let hiddenAccounts = accountStorage.get(
                this._getStorageKey("hiddenAccounts", state),
                []
            );
            if (unfollowed_accounts.length && !hiddenAccounts.length) {
                accountStorage.set(
                    this._getStorageKey("hiddenAccounts", state),
                    unfollowed_accounts
                );
                accountStorage.delete("unfollowed_accounts");
                this.setState({
                    myHiddenAccounts: Immutable.Set(unfollowed_accounts)
                });
            }
        } catch (err) {
            console.error(err);
        }
    }

    _checkReferrer() {
        let referralAccount = "";
        if (window) {
            function getQueryParam(param) {
                var result = window.location.search.match(
                    new RegExp("(\\?|&)" + param + "(\\[\\])?=([^&]*)")
                );

                return result ? decodeURIComponent(result[3]) : false;
            }
            let validQueries = ["r", "ref", "referrer", "referral"];
            for (let i = 0; i < validQueries.length; i++) {
                referralAccount = getQueryParam(validQueries[i]);
                if (referralAccount) break;
            }
        }
        if (referralAccount) {
            accountStorage.set("referralAccount", referralAccount); // Reset to empty string when the user returns with no ref code
        } else {
            accountStorage.remove("referralAccount");
        }
        if (referralAccount) console.log("referralAccount", referralAccount);
        return referralAccount;
    }

    reset() {
        if (this.state.subbed) ChainStore.unsubscribe(this.chainStoreUpdate);
        this.setState(this._getInitialState());
    }

    onSetWallet({wallet_name}) {
        this.setWallet(wallet_name);
    }

    setWallet(wallet_name) {
        if (wallet_name !== this.state.wallet_name) {
            this.setState({
                wallet_name: wallet_name,
                passwordAccount: accountStorage.get(
                    this._getStorageKey("passwordAccount", {wallet_name}),
                    null
                ),
                starredAccounts: Immutable.Map(
                    accountStorage.get(
                        this._getStorageKey("starredAccounts", {wallet_name})
                    )
                ),
                myActiveAccounts: Immutable.Set(),
                accountContacts: Immutable.Set(
                    accountStorage.get(
                        this._getStorageKey("accountContacts", {wallet_name}),
                        []
                    )
                ),
                myHiddenAccounts: Immutable.Set(
                    accountStorage.get(
                        this._getStorageKey("hiddenAccounts", {wallet_name}),
                        []
                    )
                )
            });
            this.tryToSetCurrentAccount();

            this._migrateUnfollowedAccounts({wallet_name});
        }
    }

    _getInitialState() {
        this.account_refs = null;
        this.initial_account_refs_load = true; // true until all undefined accounts are found

        const wallet_name = this.state.wallet_name || "";
        let starredAccounts = Immutable.Map(
            accountStorage.get(
                this._getStorageKey("starredAccounts", {wallet_name})
            )
        );

        let accountContacts = Immutable.Set(
            accountStorage.get(
                this._getStorageKey("accountContacts", {wallet_name}),
                []
            )
        );

        return {
            update: false,
            subbed: false,
            accountsLoaded: false,
            refsLoaded: false,
            currentAccount: null,
            referralAccount: accountStorage.get("referralAccount", ""),
            passwordAccount: accountStorage.get(
                this._getStorageKey("passwordAccount", {wallet_name}),
                ""
            ),
            myActiveAccounts: Immutable.Set(),
            myHiddenAccounts: Immutable.Set(
                accountStorage.get(
                    this._getStorageKey("hiddenAccounts", {wallet_name}),
                    []
                )
            ),
            searchAccounts: Immutable.Map(),
            searchTerm: "",
            wallet_name,
            starredAccounts,
            accountContacts
        };
    }

    onAddStarAccount(account) {
        if (!this.state.starredAccounts.has(account)) {
            let starredAccounts = this.state.starredAccounts.set(account, {
                name: account
            });
            this.setState({starredAccounts});

            accountStorage.set(
                this._getStorageKey("starredAccounts"),
                starredAccounts.toJS()
            );
        } else {
            return false;
        }
    }

    onRemoveStarAccount(account) {
        let starredAccounts = this.state.starredAccounts.delete(account);
        this.setState({starredAccounts});
        accountStorage.set(
            this._getStorageKey("starredAccounts"),
            starredAccounts.toJS()
        );
    }

    onSetPasswordAccount(account) {
        let key = this._getStorageKey("passwordAccount");
        if (!account) {
            accountStorage.remove(key);
        } else {
            accountStorage.set(key, account);
        }
        if (this.state.passwordAccount !== account) {
            this.setState({
                passwordAccount: account
            });
        }
    }

    onToggleHideAccount({account, hide}) {
        let {myHiddenAccounts, myActiveAccounts} = this.state;
        if (hide && !myHiddenAccounts.has(account)) {
            myHiddenAccounts = myHiddenAccounts.add(account);
            myActiveAccounts = myActiveAccounts.delete(account);
        } else if (myHiddenAccounts.has(account)) {
            myHiddenAccounts = myHiddenAccounts.delete(account);
            myActiveAccounts = myActiveAccounts.add(account);
        }
        this.setState({myHiddenAccounts, myActiveAccounts});
    }

    loadDbData() {
        let myActiveAccounts = Immutable.Set().asMutable();
        let chainId = Apis.instance().chain_id;
        return new Promise((resolve, reject) => {
            iDB
                .load_data("linked_accounts")
                .then(data => {
                    this.state.linkedAccounts = Immutable.fromJS(
                        data || []
                    ).toSet();
                    let accountPromises = data
                        .filter(a => {
                            if (a.chainId) {
                                return a.chainId === chainId;
                            } else {
                                return true;
                            }
                        })
                        .map(a => {
                            return FetchChain("getAccount", a.name);
                        });

                    Promise.all(accountPromises)
                        .then(accounts => {
                            accounts.forEach(a => {
                                if (
                                    !!a &&
                                    this.isMyAccount(a) &&
                                    !this.state.myHiddenAccounts.has(
                                        a.get("name")
                                    )
                                ) {
                                    myActiveAccounts.add(a.get("name"));
                                } else if (!!a && !this.isMyAccount(a)) {
                                    // Remove accounts not owned by the user from the linked_accounts db
                                    this._unlinkAccount(a.get("name"));
                                }
                            });
                            let immutableAccounts = myActiveAccounts.asImmutable();
                            if (
                                this.state.myActiveAccounts !==
                                immutableAccounts
                            ) {
                                this.setState({
                                    myActiveAccounts: myActiveAccounts.asImmutable()
                                });
                            }

                            if (this.state.accountsLoaded === false) {
                                this.setState({accountsLoaded: true});
                            }

                            if (!this.state.subbed)
                                ChainStore.subscribe(this.chainStoreUpdate);
                            this.state.subbed = true;
                            this.emitChange();
                            this.chainStoreUpdate();
                            resolve();
                        })
                        .catch(err => {
                            if (!this.state.subbed)
                                ChainStore.subscribe(this.chainStoreUpdate);
                            this.state.subbed = true;
                            this.emitChange();
                            this.chainStoreUpdate();
                            reject(err);
                        });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    chainStoreUpdate() {
        this.addAccountRefs();
    }

    addAccountRefs() {
        //  Simply add them to the myActiveAccounts list (no need to persist them)
        let account_refs = AccountRefsStore.getAccountRefs();
        if (
            !this.initial_account_refs_load &&
            this.account_refs === account_refs
        ) {
            if (this.state.refsLoaded === false) {
                this.setState({refsLoaded: true});
            }
            return;
        }
        this.account_refs = account_refs;
        let pending = false;

        if (this.addAccountRefsInProgress) return;
        this.addAccountRefsInProgress = true;
        let myActiveAccounts = this.state.myActiveAccounts.withMutations(
            accounts => {
                account_refs.forEach(id => {
                    let account = ChainStore.getAccount(id);
                    if (account === undefined) {
                        pending = true;
                        return;
                    }

                    let linkedEntry = {
                        name: account.get("name"),
                        chainId: Apis.instance().chain_id
                    };
                    let isAlreadyLinked = this.state.linkedAccounts.find(a => {
                        return (
                            a.get("name") === linkedEntry.name &&
                            a.get("chainId") === linkedEntry.chainId
                        );
                    });

                    /*
                    * Some wallets contain deprecated entries with no chain
                    * ids, remove these then write new entires with chain ids
                    */
                    const nameOnlyEntry = this.state.linkedAccounts.findKey(
                        a => {
                            return (
                                a.get("name") === linkedEntry.name &&
                                !a.has("chainId")
                            );
                        }
                    );
                    if (!!nameOnlyEntry) {
                        this.state.linkedAccounts = this.state.linkedAccounts.delete(
                            nameOnlyEntry
                        );
                        this._unlinkAccount(account.get("name"));
                        isAlreadyLinked = false;
                    }
                    if (
                        account &&
                        this.isMyAccount(account) &&
                        !isAlreadyLinked
                    ) {
                        this._linkAccount(account.get("name"));
                    }
                    if (
                        account &&
                        !accounts.includes(account.get("name")) &&
                        !this.state.myHiddenAccounts.has(account.get("name"))
                    ) {
                        accounts.add(account.get("name"));
                    }
                });
            }
        );
        if (myActiveAccounts !== this.state.myActiveAccounts) {
            this.setState({myActiveAccounts});
        }
        this.initial_account_refs_load = pending;
        this.tryToSetCurrentAccount();
        this.addAccountRefsInProgress = false;
    }

    getMyAccounts() {
        if (!this.state.subbed) {
            return [];
        }

        let accounts = [];
        for (let account_name of this.state.myActiveAccounts) {
            let account = ChainStore.getAccount(account_name);
            if (account === undefined) {
                // console.log(account_name, "account undefined");
                continue;
            }
            if (account == null) {
                console.log(
                    "WARN: non-chain account name in myActiveAccounts",
                    account_name
                );
                continue;
            }
            let auth = this.getMyAuthorityForAccount(account);

            if (auth === undefined) {
                // console.log(account_name, "auth undefined");
                continue;
            }

            if (auth === "full" || auth === "partial") {
                accounts.push(account_name);
            }

            // console.log("account:", account_name, "auth:", auth);
        }
        if (
            this.state.passwordAccount &&
            accounts.indexOf(this.state.passwordAccount) === -1
        )
            accounts.push(this.state.passwordAccount);
        // console.log("accounts:", accounts, "myActiveAccounts:", this.state.myActiveAccounts && this.state.myActiveAccounts.toJS());
        return accounts.sort();
    }

    /**
        @todo "partial"
        @return string "none", "full", "partial" or undefined (pending a chain store lookup)
    */
    getMyAuthorityForAccount(account, recursion_count = 1) {
        if (!account) return undefined;

        let owner_authority = account.get("owner");
        let active_authority = account.get("active");

        let owner_pubkey_threshold = pubkeyThreshold(owner_authority);
        if (owner_pubkey_threshold == "full") return "full";
        let active_pubkey_threshold = pubkeyThreshold(active_authority);
        if (active_pubkey_threshold == "full") return "full";

        let owner_address_threshold = addressThreshold(owner_authority);
        if (owner_address_threshold == "full") return "full";
        let active_address_threshold = addressThreshold(active_authority);
        if (active_address_threshold == "full") return "full";

        let owner_account_threshold, active_account_threshold;

        // if (account.get("name") === "secured-x") {
        //     debugger;
        // }
        if (recursion_count < 3) {
            owner_account_threshold = this._accountThreshold(
                owner_authority,
                recursion_count
            );
            if (owner_account_threshold === undefined) return undefined;
            if (owner_account_threshold == "full") return "full";

            active_account_threshold = this._accountThreshold(
                active_authority,
                recursion_count
            );
            if (active_account_threshold === undefined) return undefined;
            if (active_account_threshold == "full") return "full";
        }

        if (
            owner_pubkey_threshold === "partial" ||
            active_pubkey_threshold === "partial" ||
            owner_address_threshold === "partial" ||
            active_address_threshold === "partial" ||
            owner_account_threshold === "partial" ||
            active_account_threshold === "partial"
        )
            return "partial";
        return "none";
    }

    _accountThreshold(authority, recursion_count) {
        let account_auths = authority.get("account_auths");
        if (!account_auths.size) return "none";

        let auths = account_auths.map(auth => {
            let account = ChainStore.getAccount(auth.get(0), false);
            if (account === undefined) return undefined;
            return this.getMyAuthorityForAccount(account, ++recursion_count);
        });

        let final = auths.reduce((map, auth) => {
            return map.set(auth, true);
        }, Immutable.Map());

        return final.get("full") && final.size === 1
            ? "full"
            : final.get("partial") && final.size === 1
                ? "partial"
                : final.get("none") && final.size === 1
                    ? "none"
                    : final.get("full") || final.get("partial")
                        ? "partial"
                        : undefined;
    }

    isMyAccount(account) {
        let authority = this.getMyAuthorityForAccount(account);
        if (authority === undefined) return undefined;
        return authority === "partial" || authority === "full";
    }

    onAccountSearch(payload) {
        this.state.searchTerm = payload.searchTerm;
        this.state.searchAccounts = this.state.searchAccounts.clear();
        payload.accounts.forEach(account => {
            this.state.searchAccounts = this.state.searchAccounts.withMutations(
                map => {
                    map.set(account[1], account[0]);
                }
            );
        });
    }

    _getStorageKey(key = "currentAccount", state = this.state) {
        const wallet = state.wallet_name;
        const chainId = Apis.instance().chain_id;
        return (
            key +
            (chainId ? `_${chainId.substr(0, 8)}` : "") +
            (wallet ? `_${wallet}` : "")
        );
    }

    tryToSetCurrentAccount() {
        const passwordAccountKey = this._getStorageKey("passwordAccount");
        const currentAccountKey = this._getStorageKey("currentAccount");
        if (accountStorage.has(passwordAccountKey)) {
            const acc = accountStorage.get(passwordAccountKey, null);
            if (this.state.passwordAccount !== acc) {
                this.setState({passwordAccount: acc});
            }
            return this.setCurrentAccount(acc);
        } else if (accountStorage.has(currentAccountKey)) {
            return this.setCurrentAccount(
                accountStorage.get(currentAccountKey, null)
            );
        }

        let {starredAccounts} = this.state;
        if (starredAccounts.size) {
            return this.setCurrentAccount(starredAccounts.first().name);
        }
        if (this.state.myActiveAccounts.size) {
            return this.setCurrentAccount(this.state.myActiveAccounts.first());
        }
    }

    setCurrentAccount(name) {
        if (this.state.passwordAccount) name = this.state.passwordAccount;
        const key = this._getStorageKey();
        if (!name) {
            name = null;
        }

        if (this.state.currentAccount !== name) {
            this.setState({currentAccount: name});
        }

        accountStorage.set(key, name || null);
    }

    onSetCurrentAccount(name) {
        this.setCurrentAccount(name);
    }

    onCreateAccount(name_or_account) {
        let account = name_or_account;
        if (typeof account === "string") {
            account = {
                name: account
            };
        }

        if (account["toJS"]) account = account.toJS();

        if (account.name == "" || this.state.myActiveAccounts.get(account.name))
            return Promise.resolve();

        if (!ChainValidation.is_account_name(account.name))
            throw new Error("Invalid account name: " + account.name);

        return iDB
            .add_to_store("linked_accounts", {
                name: account.name,
                chainId: Apis.instance().chain_id
            })
            .then(() => {
                console.log(
                    "[AccountStore.js] ----- Added account to store: ----->",
                    account.name
                );
                this.state.myActiveAccounts = this.state.myActiveAccounts.add(
                    account.name
                );
                if (this.state.myActiveAccounts.size === 1) {
                    this.setCurrentAccount(account.name);
                }
            });
    }

    onAddAccountContact(name) {
        if (!ChainValidation.is_account_name(name, true))
            throw new Error("Invalid account name: " + name);

        if (!this.state.accountContacts.has(name)) {
            const accountContacts = this.state.accountContacts.add(name);
            accountStorage.set(
                this._getStorageKey("accountContacts"),
                accountContacts.toArray()
            );
            this.setState({
                accountContacts: accountContacts
            });
        }
    }

    onRemoveAccountContact(name) {
        if (!ChainValidation.is_account_name(name, true))
            throw new Error("Invalid account name: " + name);

        if (this.state.accountContacts.has(name)) {
            const accountContacts = this.state.accountContacts.remove(name);

            accountStorage.set(
                this._getStorageKey("accountContacts"),
                accountContacts
            );

            this.setState({
                accountContacts: accountContacts
            });
        }
    }

    _linkAccount(name) {
        if (!ChainValidation.is_account_name(name, true))
            throw new Error("Invalid account name: " + name);

        // Link
        const linkedEntry = {
            name,
            chainId: Apis.instance().chain_id
        };
        try {
            iDB.add_to_store("linked_accounts", linkedEntry);
            this.state.linkedAccounts = this.state.linkedAccounts.add(
                Immutable.fromJS(linkedEntry)
            ); // Keep the local linkedAccounts in sync with the db
            if (!this.state.myHiddenAccounts.has(name))
                this.state.myActiveAccounts = this.state.myActiveAccounts.add(
                    name
                );

            // Update current account if only one account is linked
            if (this.state.myActiveAccounts.size === 1) {
                this.setCurrentAccount(name);
            }
        } catch (err) {
            console.error(err);
        }
    }

    _unlinkAccount(name) {
        if (!ChainValidation.is_account_name(name, true))
            throw new Error("Invalid account name: " + name);

        // Unlink
        iDB.remove_from_store("linked_accounts", name);
        // this.state.myActiveAccounts = this.state.myActiveAccounts.delete(name);

        // Update current account if no accounts are linked
        // if (this.state.myActiveAccounts.size === 0) {
        //     this.setCurrentAccount(null);
        // }
    }

    isMyKey(key) {
        return PrivateKeyStore.hasKey(key);
    }

    onChangeSetting(payload) {
        if (payload.setting === "passwordLogin" && payload.value === false) {
            this.onSetPasswordAccount(null);
            accountStorage.remove(this._getStorageKey());
        }
    }
}

export default alt.createStore(AccountStore, "AccountStore");

// @return 3 full, 2 partial, 0 none
function pubkeyThreshold(authority) {
    let available = 0;
    let required = authority.get("weight_threshold");
    let key_auths = authority.get("key_auths");
    for (let k of key_auths) {
        if (PrivateKeyStore.hasKey(k.get(0))) {
            available += k.get(1);
        }
        if (available >= required) break;
    }
    return available >= required ? "full" : available > 0 ? "partial" : "none";
}

// @return 3 full, 2 partial, 0 none
function addressThreshold(authority) {
    let available = 0;
    let required = authority.get("weight_threshold");
    let address_auths = authority.get("address_auths");
    if (!address_auths.size) return "none";
    let addresses = AddressIndex.getState().addresses;
    for (let k of address_auths) {
        let address = k.get(0);
        let pubkey = addresses.get(address);
        if (PrivateKeyStore.hasKey(pubkey)) {
            available += k.get(1);
        }
        if (available >= required) break;
    }
    return available >= required ? "full" : available > 0 ? "partial" : "none";
}
