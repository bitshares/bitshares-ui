import ls from "./localStorage";
import {bitsparkAPIs} from "api/apiConfig";
import {availableGateways} from "common/gateways";
const bitsparkStorage = new ls("");

let fetchInProgess = {};
let fetchCache = {};
let clearIntervals = {};
const fetchCacheTTL = 30000;
function setCacheClearTimer(key) {
    clearIntervals[key] = setTimeout(() => {
        delete fetchCache[key];
        delete clearIntervals[key];
    }, fetchCacheTTL);
}

export function fetchCoins(url = bitsparkAPIs.BASE + bitsparkAPIs.COINS_LIST) {
    const key = "fetchCoins_" + url;
    let currentPromise = fetchInProgess[key];
    if (fetchCache[key]) {
        return Promise.resolve(fetchCache[key]);
    } else if (!currentPromise) {
        fetchInProgess[key] = currentPromise = fetch(url)
            .then(reply =>
                reply.json().then(result => {
                    // throw new Error("Test");
                    return result;
                })
            )
            .catch(err => {
                console.log(`fetchCoins error from ${url}: ${err}`);
                throw err;
            });
    }
    return new Promise((res, rej) => {
        currentPromise
            .then(result => {
                fetchCache[key] = result;
                res(result);
                delete fetchInProgess[key];
                if (!clearIntervals[key]) setCacheClearTimer(key);
            })
            .catch(rej);
    });
}

export function getDepositAddress({coin, account, stateCallback}) {
    let body = {
        coin,
        account
    };

    let body_string = JSON.stringify(body);

    fetch(bitsparkAPIs.BASE + "/simple-api/get-last-address", {
        method: "POST",
        headers: new Headers({
            Accept: "application/json",
            "Content-Type": "application/json"
        }),
        body: body_string
    })
        .then(
            data => {
                data.json().then(
                    json => {
                        let address = {
                            address: json.address,
                            memo: json.memo || null,
                            error: json.error || null,
                            loading: false
                        };
                        if (stateCallback) stateCallback(address);
                    },
                    error => {
                        console.log("error: ", error);
                        if (stateCallback)
                            stateCallback({address: error.message, memo: null});
                    }
                );
            },
            error => {
                console.log("error: ", error);
                if (stateCallback)
                    stateCallback({address: error.message, memo: null});
            }
        )
        .catch(err => {
            console.log("fetch error:", err);
        });
}

let depositRequests = {};
export function requestDepositAddress({
    inputCoinType,
    outputCoinType,
    outputAddress,
    url = bitsparkAPIs.BASE,
    stateCallback,
    selectedGateway
}) {
    let gatewayStatus = availableGateways[selectedGateway];

    let body = {
        inputCoinType,
        outputCoinType,
        outputAddress
    };

    let body_string = JSON.stringify(body);
    if (depositRequests[body_string]) return;
    depositRequests[body_string] = true;
    fetch(url + "/simple-api/initiate-trade", {
        method: "post",
        headers: new Headers({
            Accept: "application/json",
            "Content-Type": "application/json"
        }),
        body: body_string
    })
        .then(
            reply => {
                reply.json().then(
                    json => {
                        delete depositRequests[body_string];
                        // console.log( "reply: ", json );
                        let address = {
                            address: json.inputAddress || "unknown",
                            memo: json.inputMemo,
                            error: json.error || null
                        };
                        if (stateCallback) stateCallback(address);
                    },
                    error => {
                        console.log("error: ", error);
                        delete depositRequests[body_string];
                        if (stateCallback) stateCallback(null);
                    }
                );
            },
            error => {
                console.log("error: ", error);
                delete depositRequests[body_string];
                if (stateCallback) stateCallback(null);
            }
        )
        .catch(err => {
            console.log("fetch error:", err);
            delete depositRequests[body_string];
        });
}

export function validateAddress({
    url = bitsparkAPIs.BASE,
    walletType,
    newAddress,
    output_coin_type = null,
    method = null
}) {
    if (!newAddress) return new Promise(res => res());

    if (!method || method == "GET") {
        url +=
            "/wallets/" +
            walletType +
            "/address-validator?address=" +
            encodeURIComponent(newAddress);
        if (output_coin_type) {
            url += "&outputCoinType=" + output_coin_type;
        }
        return fetch(url, {
            method: "get",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json"
            })
        })
            .then(reply => reply.json().then(json => json.isValid))
            .catch(err => {
                console.log("validate error:", err);
            });
    } else if (method == "POST") {
        return fetch(url + "/wallets/" + walletType + "/check-address", {
            method: "post",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({address: newAddress})
        })
            .then(reply => reply.json().then(json => json.isValid))
            .catch(err => {
                console.log("validate error:", err);
            });
    }
}

function hasWithdrawalAddress(wallet) {
    return bitsparkStorage.has(`history_address_${wallet}`);
}

function setWithdrawalAddresses({wallet, addresses}) {
    bitsparkStorage.set(`history_address_${wallet}`, addresses);
}

function getWithdrawalAddresses(wallet) {
    return bitsparkStorage.get(`history_address_${wallet}`, []);
}

function setLastWithdrawalAddress({wallet, address}) {
    bitsparkStorage.set(`history_address_last_${wallet}`, address);
}

function getLastWithdrawalAddress(wallet) {
    return bitsparkStorage.get(`history_address_last_${wallet}`, "");
}

export const WithdrawAddresses = {
    has: hasWithdrawalAddress,
    set: setWithdrawalAddresses,
    get: getWithdrawalAddresses,
    setLast: setLastWithdrawalAddress,
    getLast: getLastWithdrawalAddress
};
