import alt from "alt-instance";

import {cryptoBridgeAPIs} from "../api/apiConfig";
import WalletDb from "stores/WalletDb";
import {TransactionBuilder} from "bitsharesjs/es";

const API_MARKET_URL = cryptoBridgeAPIs.BASE + cryptoBridgeAPIs.MARKETS;
const API_NEWS_URL = "https://crypto-bridge.org/news.json";
const API_LOGIN_URL = cryptoBridgeAPIs.BASE_V2 + cryptoBridgeAPIs.LOGIN;
const API_ME_URL = cryptoBridgeAPIs.BASE_V2 + cryptoBridgeAPIs.ACCOUNTS + "/me";
const API_ME_TERMS_URL =
    cryptoBridgeAPIs.BASE_V2 + cryptoBridgeAPIs.ACCOUNTS + "/me/terms";

import {
    getRequestLoginOptions,
    getRequestAccessOptions
} from "lib/common/AccountUtils";

const BCO_ASSET_ID = "1.3.1564";

let news = null;
let newsTTL = 60 * 60 * 1000; // 60 minutes

const defaultMarkets = [
    {
        id: "BRIDGE.BCO_BRIDGE.BTC",
        quote: "BRIDGE.BCO",
        base: "BRIDGE.BTC"
    }
];

let markets = {
    data: null
};
let marketsTTL = 60 * 60 * 1000; // 60 minutes

class CryptoBridgeActions {
    login(account) {
        return fetch(API_LOGIN_URL, getRequestLoginOptions(account)).then(
            response => response.json()
        );
    }

    updateTerms(account, version) {
        return dispatch => {
            return new Promise((resolve, reject) => {
                this.login(account)
                    .then(access => {
                        fetch(
                            `${API_ME_TERMS_URL}?version=${version
                                .toString()
                                .substr(0, 10)}`,
                            Object.assign(getRequestAccessOptions(access), {
                                method: "PUT"
                            })
                        )
                            .then(() => {
                                dispatch({
                                    accountName: account.get("name"),
                                    version
                                });
                                resolve();
                            })
                            .catch(err => {
                                dispatch();
                                reject(err);
                            });
                    })
                    .catch(err => {
                        dispatch();
                        reject(err);
                    });
            });
        };
    }

    getAccount(account) {
        return dispatch => {
            this.login(account)
                .then(access => {
                    fetch(API_ME_URL, getRequestAccessOptions(access))
                        .then(response => response.json())
                        .then(account => {
                            dispatch({access, account});
                        })
                        .catch(err => {
                            dispatch({});
                        });
                })
                .catch(err => {
                    dispatch({});
                });
        };
    }

    removeAccount(accountName) {
        return dispatch => {
            dispatch(accountName);
        };
    }

    getMarkets() {
        return dispatch => {
            const now = new Date();

            if (markets.lastFetched) {
                if (now - markets.lastFetched < marketsTTL) {
                    return; // we just fetched the results, no need to update...
                }
            } else {
                dispatch(defaultMarkets);
            }

            markets.lastFetched = new Date();

            fetch(API_MARKET_URL)
                .then(reply =>
                    reply.json().then(result => {
                        markets = {
                            lastFetched: new Date(),
                            data: result.filter(m => m.blacklisted !== true)
                        };

                        dispatch(markets.data);
                    })
                )
                .catch(err => {
                    markets.lastFetched = null;
                });
        };
    }

    getNews() {
        return dispatch => {
            const now = new Date();

            if (news && now - news.lastFetched < newsTTL) {
                return;
            }

            news = {
                lastFetched: new Date(),
                data: null
            };

            fetch(API_NEWS_URL)
                .then(reply =>
                    reply.json().then(news => {
                        news = {
                            lastFetched: new Date(),
                            data: news.articles
                        };

                        dispatch(news.data);
                    })
                )
                .catch(err => {
                    news = null;
                });
        };
    }

    stakeBalance(account, period, amount) {
        let tr = new TransactionBuilder();

        tr.add_type_operation("vesting_balance_create", {
            fee: {amount: "0", asset_id: BCO_ASSET_ID},
            creator: account,
            owner: account,
            amount: {
                amount: amount * Math.pow(10, 7),
                asset_id: BCO_ASSET_ID
            },
            policy: [
                1,
                {
                    start_claim: new Date().toISOString().slice(0, 19),
                    vesting_seconds: period
                }
            ]
        });

        return WalletDb.process_transaction(tr, null, true)
            .then(result => {})
            .catch(err => {
                console.log("vesting_balance_create err:", err);
            });
    }

    claimStakingBalance(account, cvb) {
        let tr = new TransactionBuilder();

        const balance = cvb.balance.amount;

        tr.add_type_operation("vesting_balance_withdraw", {
            fee: {amount: "0", asset_id: BCO_ASSET_ID},
            owner: account,
            vesting_balance: cvb.id,
            amount: {
                amount: Math.floor(balance),
                asset_id: cvb.balance.asset_id
            }
        });

        return WalletDb.process_transaction(tr, null, true)
            .then(result => {})
            .catch(err => {
                console.log("vesting_balance_withdraw err:", err);
            });
    }
}

export default alt.createActions(CryptoBridgeActions);
