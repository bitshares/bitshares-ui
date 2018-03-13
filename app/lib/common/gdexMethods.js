import ls from "./localStorage";
import {gdexAPIs} from "api/apiConfig";

const gdexStorage = new ls("");

let assetsRequest = {};
let REQUEST_TIMEOUT = 10000;

export function fetchWithdrawRule(reqBody, timeout = -1) {
    return requestSimple(
        reqBody,
        gdexAPIs.BASE + gdexAPIs.WITHDRAW_RULE,
        timeout
    );
}

export function userAgreement(reqBody, timeout = -1) {
    return requestSimple(
        reqBody,
        gdexAPIs.BASE + gdexAPIs.USER_AGREEMENT,
        timeout
    );
}

export function fetchAssets(reqBody, timeout = -1) {
    if (!reqBody.requestType) reqBody.requestType = 0;
    if (!reqBody.assetType) reqBody.assetType = 0;
    if (!reqBody.version) reqBody.version = "1.1";
    return requestSimple(reqBody, gdexAPIs.BASE + gdexAPIs.ASSET_LIST, timeout);
}

//"userAccount"
export function fetchUserInfo(reqBody, timeout = -1) {
    return requestSimple(
        reqBody,
        gdexAPIs.BASE + gdexAPIs.GET_USER_INFO,
        timeout
    );
}

export function validateAddress(reqBody, timeout = -1) {
    if (!reqBody.address) return new Promise(res => res());
    return requestSimple(
        reqBody,
        gdexAPIs.BASE + gdexAPIs.CHECK_WITHDRAY_ADDRESS,
        timeout
    );
}

export function requestDepositAddress(reqBody, timeout = -1) {
    return requestSimple(
        reqBody,
        gdexAPIs.BASE + gdexAPIs.GET_DEPOSIT_ADDRESS,
        timeout
    );
}

export function getTransactionRecordList(reqBody, type, timeout = -1) {
    if (type == 1) return getDepositRecordList(reqBody, timeout);
    else if (type == 2) return getWithdrawRecordList(reqBody, timeout);
    else return new Promise(res => res());
}

export function getDepositRecordList(reqBody, timeout = -1) {
    return requestSimple(
        reqBody,
        gdexAPIs.BASE + gdexAPIs.DEPOSIT_RECORD_LIST,
        timeout
    );
}

export function getWithdrawRecordList(reqBody, timeout = -1) {
    return requestSimple(
        reqBody,
        gdexAPIs.BASE + gdexAPIs.WITHDRAW_RECORD_LIST,
        timeout
    );
}

function requestSimple(reqBody, reqUrl, timeout = -1) {
    if (timeout == -1) {
        return requestWithTimeout(reqBody, reqUrl, REQUEST_TIMEOUT);
    } else if (timeout == 0) {
        return requestWithoutTimeout(reqBody, reqUrl);
    } else {
        return requestWithTimeout(reqBody, reqUrl, timeout);
    }
}

function requestWithTimeout(reqBody, reqUrl, timeout) {
    if (!reqBody.requestChannel) reqBody.requestChannel = 0;
    if (!reqBody.version) reqBody.version = "1.0";
    if (!reqBody.timestamp) reqBody.timestamp = new Date().getTime();
    if (!reqBody.outerChannel) reqBody.outerChannel = "Bitshares";
    let body_string = JSON.stringify(reqBody);
    if (assetsRequest[body_string]) return;
    assetsRequest[body_string] = true;
    return Promise.race([
        new Promise((resolve, reject) => {
            fetch(reqUrl, {
                method: "post",
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }),
                body: body_string
                // mode: "no-cors"
            }).then(reply => {
                reply
                    .json()
                    .then(json => {
                        delete assetsRequest[body_string];
                        if (json.code !== 0) {
                            console.log(json);
                            reject({code: json.code, message: json.message});
                        }
                        resolve(json.data);
                    })
                    .catch(err => {
                        delete assetsRequest[body_string];
                        reject({code: -1, message: err.message});
                    });
            });
        }),
        new Promise(function(resolve, reject) {
            setTimeout(() => {
                reject({code: -2, message: "Request timeout."});
            }, timeout);
        })
    ]);
}

function requestWithoutTimeout(reqBody, reqUrl) {
    if (!reqBody.requestChannel) reqBody.requestChannel = 0;
    if (!reqBody.version) reqBody.version = "1.0";
    if (!reqBody.timestamp) reqBody.timestamp = new Date().getTime();
    if (!reqBody.outerChannel) reqBody.outerChannel = "Bitshares";
    let body_string = JSON.stringify(reqBody);
    if (assetsRequest[body_string]) return;
    assetsRequest[body_string] = true;
    new Promise((resolve, reject) => {
        fetch(reqUrl, {
            method: "post",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json"
            }),
            body: body_string
        }).then(reply => {
            reply
                .json()
                .then(json => {
                    delete assetsRequest[body_string];
                    if (json.code !== 0) {
                        console.log(json);
                        reject({code: json.code, message: json.message});
                    }
                    resolve(json.data);
                })
                .catch(err => {
                    delete assetsRequest[body_string];
                    reject({code: -1, message: err.message});
                });
        });
    });
}

function hasWithdrawalAddress(wallet) {
    return gdexStorage.has(`gdex_history_address_${wallet}`);
}

function setWithdrawalAddresses({wallet, addresses}) {
    gdexStorage.set(`gdex_history_address_${wallet}`, addresses);
}

function getWithdrawalAddresses(wallet) {
    return gdexStorage.get(`gdex_history_address_${wallet}`, []);
}

function setLastWithdrawalAddress({wallet, address}) {
    gdexStorage.set(`gdex_history_address_last_${wallet}`, address);
}

function getLastWithdrawalAddress(wallet) {
    return gdexStorage.get(`gdex_history_address_last_${wallet}`, "");
}

export const WithdrawAddresses = {
    has: hasWithdrawalAddress,
    set: setWithdrawalAddresses,
    get: getWithdrawalAddresses,
    setLast: setLastWithdrawalAddress,
    getLast: getLastWithdrawalAddress
};
