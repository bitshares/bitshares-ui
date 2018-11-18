import ls from "./localStorage";
import {xbtsxAPIs} from "api/apiConfig";
const xbtsxStorage = new ls("");

export function fetchCoinList(url = xbtsxAPIs.BASE + xbtsxAPIs.COINS_LIST) {
    return fetch(url, {method: "post"})
        .then(reply =>
            reply.json().then(result => {
                return result;
            })
        )
        .catch(err => {
            console.log("error fetching xbtsx list of coins", err, url);
        });
}

export function requestDepositAddress({
    walletType,
    inputCoinType,
    outputCoinType,
    outputAddress,
    url = xbtsxAPIs.BASE,
    stateCallback
}) {
    let body = {
        inputCoinType,
        outputCoinType,
        outputAddress
    };

    let body_string = JSON.stringify(body);

    fetch(url + `/wallets/${walletType}/new-deposit-address`, {
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
                        // console.log( "reply: ", json )
                        let address = {
                            address: json.inputAddress || "unknown",
                            memo: json.inputMemo,
                            error: json.error || null
                        };
                        if (stateCallback) stateCallback(address);
                    },
                    error => {
                        // console.log( "error: ",error  );
                        if (stateCallback)
                            stateCallback({address: "unknown", memo: null});
                    }
                );
            },
            error => {
                // console.log( "error: ",error  );
                if (stateCallback)
                    stateCallback({address: "unknown", memo: null});
            }
        )
        .catch(err => {
            console.log("fetch error:", err);
        });
}

export function validateAddress({
    url = xbtsxAPIs.BASE,
    walletType,
    newAddress
}) {
    if (!newAddress) return new Promise(res => res());
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

function hasWithdrawalAddress(wallet) {
    return xbtsxStorage.has(`history_address_${wallet}`);
}

function setWithdrawalAddresses({wallet, addresses}) {
    xbtsxStorage.set(`history_address_${wallet}`, addresses);
}

function getWithdrawalAddresses(wallet) {
    return xbtsxStorage.get(`history_address_${wallet}`, []);
}

function setLastWithdrawalAddress({wallet, address}) {
    xbtsxStorage.set(`history_address_last_${wallet}`, address);
}

function getLastWithdrawalAddress(wallet) {
    return xbtsxStorage.get(`history_address_last_${wallet}`, "");
}

export const WithdrawAddresses = {
    has: hasWithdrawalAddress,
    set: setWithdrawalAddresses,
    get: getWithdrawalAddresses,
    setLast: setLastWithdrawalAddress,
    getLast: getLastWithdrawalAddress
};
