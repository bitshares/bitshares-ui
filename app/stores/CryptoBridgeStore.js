import {Map, OrderedMap} from "immutable";
import alt from "alt-instance";
import CryptoBridgeActions from "actions/CryptoBridgeActions";
import BaseStore from "./BaseStore";
import sha256 from "js-sha256";

class CryptoBridgeStore extends BaseStore {
    constructor() {
        super();

        this.markets = OrderedMap();
        this.assets = Map();
        this.accounts = Map();
        this.news = null;
        this.terms = null;

        this.bindListeners({
            onGetCryptoBridgeMarkets: CryptoBridgeActions.getMarkets,
            onGetCryptoBridgeNews: CryptoBridgeActions.getNews,
            onGetAccount: CryptoBridgeActions.getAccount,
            onRemoveAccount: CryptoBridgeActions.removeAccount,
            onUpdateAccount: CryptoBridgeActions.updateAccount,
            onGetLatestTerms: CryptoBridgeActions.getLatestTerms
        });

        this._export(
            "getAccountRequiresForcedAction",
            "getAccountRequiresKycAction",
            "getAccountRequiresKycForcedAction",
            "getAccountRequiresTosAction",
            "getAccountRequiresTosForcedAction",
            "getLatestTerms"
        );
    }

    onGetCryptoBridgeMarkets(markets) {
        if (markets) {
            markets.map(m => {
                this.markets = this.markets.set(m.id, m);
            });
        }
    }

    onGetCryptoBridgeNews(news) {
        if (news) {
            this.news = news;
        }
    }

    onGetAccount(data) {
        const {access, account} = data;
        if (access && account) {
            this.accounts = this.accounts.set(account.name, data);
        }
    }

    onRemoveAccount(accountName) {
        this.accounts = this.accounts.delete(accountName);
    }

    onUpdateAccount(update) {
        const {accountName, data} = update || {};

        if (accountName && data) {
            const accountData = this.accounts.get(accountName);

            if (accountData) {
                accountData.account.terms.accepted = data.terms_version;

                this.accounts = this.accounts.set(accountName, accountData);
            }
        }
    }

    onGetLatestTerms(terms) {
        console.log(terms);
        console.log(sha256(terms.payload));

        this.terms = terms;
    }

    getLatestTerms() {
        return this.terms;
    }

    getAccountRequiresTosAction(accountName) {
        const {account} = this.accounts.get(accountName, {});

        return !account || account.terms.status !== "complete";
    }

    getAccountRequiresKycAction(accountName) {
        const {account} = this.accounts.get(accountName, {});

        return (
            !account ||
            (account.kyc.required === true && account.kyc.status !== "complete")
        );
    }

    getAccountRequiresKycForcedAction(accountName) {
        const {account} = this.accounts.get(accountName, {});

        return (
            !account ||
            (this.getAccountRequiresKycAction(accountName) &&
                account.kyc.deadline &&
                new Date(account.kyc.deadline).getTime() < Date.now())
        );
    }

    getAccountRequiresTosForcedAction(accountName) {
        const {account} = this.accounts.get(accountName, {});

        return (
            !account ||
            (this.getAccountRequiresTosAction(accountName) &&
                new Date(account.terms.latest.deadline).getTime() < Date.now())
        );
    }

    getAccountRequiresForcedAction(accountName) {
        if (
            !this.getAccountRequiresKycForcedAction(accountName) &&
            !this.getAccountRequiresTosForcedAction(accountName)
        ) {
            return false;
        }

        return true;
    }
}

export default alt.createStore(CryptoBridgeStore, "CryptoBridgeStore");
