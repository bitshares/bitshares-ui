import ls from "./localStorage";
import {citadelAPIs} from "api/apiConfig";
import {availableGateways} from "common/gateways";
const citadelStorage = new ls("");

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

export function fetchTradingPairs(
    url = citadelAPIs.BASE + citadelAPIs.TRADING_PAIRS
) {
    const key = "fetchTradingPairs_" + url;
    let currentPromise = fetchInProgess[key];
    if (fetchCache[key]) {
        return Promise.resolve(fetchCache[key]);
    } else if (!currentPromise) {
        fetchInProgess[key] = currentPromise = fetch(url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        })
            .then(reply =>
                reply.json().then(result => {
                    return result;
                })
            )
            .catch(err => {
                console.log(`fetchTradingPairs error from ${url}: ${err}`);
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

export function getDepositLimit(
    inputCoin,
    outputCoin,
    url = citadelAPIs.BASE + citadelAPIs.DEPOSIT_LIMIT
) {
    return fetch(
        url +
            "?inputCoinType=" +
            encodeURIComponent(inputCoin) +
            "&outputCoinType=" +
            encodeURIComponent(outputCoin),
        {method: "get", headers: new Headers({Accept: "application/json"})}
    )
        .then(reply =>
            reply.json().then(result => {
                return result;
            })
        )
        .catch(err => {
            console.log(
                "error fetching deposit limit of",
                inputCoin,
                outputCoin,
                err
            );
        });
}

export function estimateOutput(
    inputAmount,
    inputCoin,
    outputCoin,
    url = citadelAPIs.BASE + citadelAPIs.ESTIMATE_OUTPUT
) {
    return fetch(
        url +
            "?inputAmount=" +
            encodeURIComponent(inputAmount) +
            "&inputCoinType=" +
            encodeURIComponent(inputCoin) +
            "&outputCoinType=" +
            encodeURIComponent(outputCoin),
        {method: "get", headers: new Headers({Accept: "application/json"})}
    )
        .then(reply =>
            reply.json().then(result => {
                return result;
            })
        )
        .catch(err => {
            console.log(
                "error fetching deposit limit of",
                inputCoin,
                outputCoin,
                err
            );
        });
}

export function estimateInput(
    outputAmount,
    inputCoin,
    outputCoin,
    url = citadelAPIs.BASE + citadelAPIs.ESTIMATE_INPUT
) {
    return fetch(
        url +
            "?outputAmount=" +
            encodeURIComponent(outputAmount) +
            "&inputCoinType=" +
            encodeURIComponent(inputCoin) +
            "&outputCoinType=" +
            encodeURIComponent(outputCoin),
        {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }
    )
        .then(reply =>
            reply.json().then(result => {
                return result;
            })
        )
        .catch(err => {
            console.log(
                "error fetching deposit limit of",
                inputCoin,
                outputCoin,
                err
            );
        });
}

export function getBackedCoins({allCoins, tradingPairs, backer}) {
    let gatewayStatus = availableGateways[backer];
    let coins_by_type = {};

    // Backer has no coinType == backingCoinType but uses single wallet style
    if (!!gatewayStatus.singleWallet) {
        allCoins.forEach(
            coin_type => (coins_by_type[coin_type.backingCoinType] = coin_type)
        );
    }

    allCoins.forEach(
        coin_type => (coins_by_type[coin_type.coinType] = coin_type)
    );

    let allowed_outputs_by_input = {};
    tradingPairs.forEach(pair => {
        if (!allowed_outputs_by_input[pair.inputCoinType])
            allowed_outputs_by_input[pair.inputCoinType] = {};
        allowed_outputs_by_input[pair.inputCoinType][
            pair.outputCoinType
        ] = true;
    });

    let backedCoins = [];
    allCoins.forEach(inputCoin => {
        let outputCoin = coins_by_type[inputCoin.backingCoinType];
        if (
            inputCoin.walletSymbol.startsWith(backer + ".") &&
            inputCoin.backingCoinType &&
            outputCoin
        ) {
            let isDepositAllowed =
                allowed_outputs_by_input[inputCoin.backingCoinType] &&
                allowed_outputs_by_input[inputCoin.backingCoinType][
                    inputCoin.coinType
                ];
            let isWithdrawalAllowed =
                allowed_outputs_by_input[inputCoin.coinType] &&
                allowed_outputs_by_input[inputCoin.coinType][
                    inputCoin.backingCoinType
                ];

            backedCoins.push({
                name: outputCoin.name,
                intermediateAccount: !!gatewayStatus.intermediateAccount
                    ? gatewayStatus.intermediateAccount
                    : outputCoin.intermediateAccount,
                gateFee: outputCoin.gateFee || outputCoin.transactionFee,
                walletType: outputCoin.walletType,
                backingCoinType: !!gatewayStatus.singleWallet
                    ? inputCoin.backingCoinType.toUpperCase()
                    : outputCoin.walletSymbol,
                minAmount: outputCoin.minAmount || 0,
                maxAmount: outputCoin.maxAmount || 999999999,
                symbol: inputCoin.walletSymbol,
                supportsMemos: outputCoin.supportsOutputMemos,
                depositAllowed: isDepositAllowed,
                withdrawalAllowed: isWithdrawalAllowed
            });
        }
    });
    return backedCoins;
}

export function validateAddress({
    url = citadelAPIs.BASE,
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

let _conversionCache = {};
export function getConversionJson(inputs) {
    const {input_coin_type, output_coin_type, url, account_name} = inputs;
    if (!input_coin_type || !output_coin_type) return Promise.reject();
    const body = JSON.stringify({
        inputCoinType: input_coin_type,
        outputCoinType: output_coin_type,
        outputAddress: account_name,
        inputMemo:
            "citadel conversion: " + input_coin_type + "to" + output_coin_type
    });

    const _cacheString =
        url + input_coin_type + output_coin_type + account_name;
    return new Promise((resolve, reject) => {
        if (_conversionCache[_cacheString])
            return resolve(_conversionCache[_cacheString]);
        fetch(url + "/simple-api/initiate-trade", {
            method: "post",
            headers: new Headers({
                Accept: "application/json",
                "Content-Type": "application/json"
            }),
            body: body
        })
            .then(reply => {
                reply
                    .json()
                    .then(json => {
                        _conversionCache[_cacheString] = json;
                        resolve(json);
                    }, reject)
                    .catch(reject);
            })
            .catch(reject);
    });
}

function hasWithdrawalAddress(wallet) {
    return citadelStorage.has(`history_address_${wallet}`);
}

function setWithdrawalAddresses({wallet, addresses}) {
    citadelStorage.set(`history_address_${wallet}`, addresses);
}

function getWithdrawalAddresses(wallet) {
    return citadelStorage.get(`history_address_${wallet}`, []);
}

function setLastWithdrawalAddress({wallet, address}) {
    citadelStorage.set(`history_address_last_${wallet}`, address);
}

function getLastWithdrawalAddress(wallet) {
    return citadelStorage.get(`history_address_last_${wallet}`, "");
}

export const WithdrawAddresses = {
    has: hasWithdrawalAddress,
    set: setWithdrawalAddresses,
    get: getWithdrawalAddresses,
    setLast: setLastWithdrawalAddress,
    getLast: getLastWithdrawalAddress
};
