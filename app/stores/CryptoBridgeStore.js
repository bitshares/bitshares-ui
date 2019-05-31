import {Map, OrderedMap} from "immutable";
import alt from "alt-instance";
import CryptoBridgeActions from "actions/CryptoBridgeActions";
import BaseStore from "./BaseStore";

class CryptoBridgeStore extends BaseStore {
    constructor() {
        super();

        this.markets = OrderedMap();
        this.assets = Map();
        this.accounts = Map();
        this.news = null;
        this.terms = null;
        this.rewards = Map();

        this.bindListeners({
            onGetCryptoBridgeMarkets: CryptoBridgeActions.getMarkets,
            onGetCryptoBridgeNews: CryptoBridgeActions.getNews,
            onGetAccount: CryptoBridgeActions.getAccount,
            onRemoveAccount: CryptoBridgeActions.removeAccount,
            onUpdateAccount: CryptoBridgeActions.updateAccount,
            onGetLatestTerms: CryptoBridgeActions.getLatestTerms,
            onGetRewards: CryptoBridgeActions.getRewards,
            onClaimReward: CryptoBridgeActions.claimReward
        });

        this._export(
            "getAccount",
            "getAccountAccess",
            "getAccountRequiresForcedAction",
            "getAccountRequiresKycAction",
            "getAccountRequiresKycForcedAction",
            "getAccountRequiresTosAction",
            "getAccountRequiresTosForcedAction",
            "getAccountKycIsPending",
            "getLatestTerms",
            "getRewards"
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
        this.terms = terms;
    }

    getLatestTerms() {
        return this.terms;
    }

    onGetRewards(data) {
        const {accountName, rewards} = data;
        if (accountName && rewards) {
            this.rewards = this.rewards.set(accountName, rewards);
        }
    }

    onClaimReward({id, type, accountName}) {
        if (accountName) {
            const rewards = this.rewards.get(accountName, []);
            this.rewards = this.rewards.set(
                accountName,
                rewards.filter(reward => reward.id !== id)
            );
        }

        console.log("onClaimReward", id, type, accountName);
    }

    getAccountRequiresTosAction(accountName) {
        const account = this.getAccount(accountName);

        return !account || account.terms.status !== "complete";
    }

    getAccountRequiresKycAction(accountName) {
        const account = this.getAccount(accountName);

        return (
            !account ||
            (account.kyc.required === true && account.kyc.status !== "complete")
        );
    }

    getAccountRequiresKycAction(accountName) {
        const account = this.getAccount(accountName);

        return (
            !account ||
            (account.kyc.required === true && account.kyc.status !== "complete")
        );
    }

    getAccountRequiresKycForcedAction(accountName) {
        const account = this.getAccount(accountName);

        return (
            !account ||
            (this.getAccountRequiresKycAction(accountName) &&
                account.kyc.deadline &&
                account.kyc.expired)
        );
    }

    getAccount(accountName) {
        const {account} = this.accounts.get(accountName, {});

        return account;
    }

    getAccountAccess(accountName) {
        const {access} = this.accounts.get(accountName, {});

        return access;
    }

    getAccountRequiresTosForcedAction(accountName) {
        const account = this.getAccount(accountName);

        return (
            !account ||
            (this.getAccountRequiresTosAction(accountName) &&
                account.terms.latest.deadline &&
                account.terms.latest.expired)
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

    getAccountKycIsPending(accountName) {
        const account = this.getAccount(accountName);

        return account && account.kyc.status === "pending";
    }

    getRewards(accountName) {
        const rewards = this.rewards.get(accountName, []);

        return rewards;
    }
}

export default alt.createStore(CryptoBridgeStore, "CryptoBridgeStore");
