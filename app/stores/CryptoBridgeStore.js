import {Map, OrderedMap} from "immutable";
import alt from "alt-instance";
import CryptoBridgeActions from "actions/CryptoBridgeActions";

class CryptoBridgeStore {
    constructor() {
        this.markets = OrderedMap();
        this.assets = Map();
        this.accounts = Map();
        this.news = null;

        this.bindListeners({
            onGetCryptoBridgeMarkets: CryptoBridgeActions.getMarkets,
            onGetCryptoBridgeNews: CryptoBridgeActions.getNews,
            onGetAccount: CryptoBridgeActions.getAccount,
            onRemoveAccount: CryptoBridgeActions.removeAccount,
            onUpdateTerms: CryptoBridgeActions.updateTerms
        });
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

    onUpdateTerms(update) {
        const {accountName, version} = update || {};

        if (accountName && version) {
            const accountData = this.accounts.get(accountName);

            if (accountData) {
                accountData.account.terms.accepted = version;
                this.accounts = this.accounts.set(accountName, accountData);
            }
        }
    }
}

export default alt.createStore(CryptoBridgeStore, "CryptoBridgeStore");
