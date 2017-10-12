import ls from "./localStorage";
import {blockTradesAPIs} from "api/apiConfig";
const blockTradesStorage = new ls("");

export function fetchCoins(url = (blockTradesAPIs.BASE_OL + blockTradesAPIs.COINS_LIST)) {
    return fetch(url).then(reply => reply.json().then(result => {
        return result;
    })).catch(err => {
        console.log("error fetching blocktrades list of coins", err, url);
    });
}

export function fetchCoinsSimple(url = (blockTradesAPIs.BASE_OL + blockTradesAPIs.COINS_LIST)) {
    return fetch(url).then(reply => reply.json().then(result => {
        return result;
    })).catch(err => {
        console.log("error fetching simple list of coins", err, url);
    });
}

export function fetchBridgeCoins(baseurl = (blockTradesAPIs.BASE)) {
    let url = baseurl + blockTradesAPIs.TRADING_PAIRS;
    return fetch(url, {method: "get", headers: new Headers({"Accept": "application/json"})}).then(reply => reply.json().then(result => {
        return result;
    })).catch(err => {
        console.log("error fetching blocktrades list of coins", err, url);
    });
}

export function getDepositLimit(inputCoin, outputCoin, url = (blockTradesAPIs.BASE + blockTradesAPIs.DEPOSIT_LIMIT)) {
    return fetch(url + "?inputCoinType=" + encodeURIComponent(inputCoin) + "&outputCoinType=" + encodeURIComponent(outputCoin),
         {method: "get", headers: new Headers({"Accept": "application/json"})}).then(reply => reply.json().then(result => {
        return result;
    })).catch(err => {
        console.log("error fetching deposit limit of", inputCoin, outputCoin, err);
    });
}

export function estimateOutput(inputAmount, inputCoin, outputCoin, url = (blockTradesAPIs.BASE + blockTradesAPIs.ESTIMATE_OUTPUT)) {
    return fetch(url + "?inputAmount=" + encodeURIComponent(inputAmount) +"&inputCoinType=" + encodeURIComponent(inputCoin) + "&outputCoinType=" + encodeURIComponent(outputCoin),
         {method: "get", headers: new Headers({"Accept": "application/json"})}).then(reply => reply.json().then(result => {
        return result;
    })).catch(err => {
        console.log("error fetching deposit limit of", inputCoin, outputCoin, err);
    });
}

export function getActiveWallets(url = (blockTradesAPIs.BASE_OL + blockTradesAPIs.ACTIVE_WALLETS)) {
    return fetch(url).then(reply => reply.json().then(result => {
        return result;
    })).catch(err => {
        console.log("error fetching blocktrades active wallets", err, url);
    });
}

let depositRequests = {};
export function requestDepositAddress({inputCoinType, outputCoinType, outputAddress, url = blockTradesAPIs.BASE_OL, stateCallback}) {
    let body = {
        inputCoinType,
        outputCoinType,
        outputAddress
    };

    let body_string = JSON.stringify(body);
    if (depositRequests[body_string]) return;
    depositRequests[body_string] = true;
    fetch( url + "/simple-api/initiate-trade", {
        method:"post",
        headers: new Headers( { "Accept": "application/json", "Content-Type":"application/json" } ),
        body: body_string
    }).then( reply => { reply.json()
        .then( json => {
            delete depositRequests[body_string];
            // console.log( "reply: ", json )
            let address = {"address": json.inputAddress || "unknown", "memo": json.inputMemo, error: json.error || null};
            if (stateCallback) stateCallback(address);
        }, error => {
            // console.log( "error: ",error  );
            delete depositRequests[body_string];
            if (stateCallback) stateCallback({"address": "unknown", "memo": null});
        });
    }, error => {
        // console.log( "error: ",error  );
        delete depositRequests[body_string];
        if (stateCallback) stateCallback({"address": "unknown", "memo": null});
    }).catch(err => {
        console.log("fetch error:", err);
        delete depositRequests[body_string];
    });
}

export function getBackedCoins({allCoins, tradingPairs, backer}) {
    let coins_by_type = {};
    allCoins.forEach(coin_type => coins_by_type[coin_type.coinType] = coin_type);

    let allowed_outputs_by_input = {};
    tradingPairs.forEach(pair => {
        if (!allowed_outputs_by_input[pair.inputCoinType])
            allowed_outputs_by_input[pair.inputCoinType] = {};
        allowed_outputs_by_input[pair.inputCoinType][pair.outputCoinType] = true;
    });

    let blocktradesBackedCoins = [];
    allCoins.forEach(coin_type => {
        if (coin_type.walletSymbol.startsWith(backer + ".") && coin_type.backingCoinType && coins_by_type[coin_type.backingCoinType]) {
            let isDepositAllowed = allowed_outputs_by_input[coin_type.backingCoinType] && allowed_outputs_by_input[coin_type.backingCoinType][coin_type.coinType];
            let isWithdrawalAllowed = allowed_outputs_by_input[coin_type.coinType] && allowed_outputs_by_input[coin_type.coinType][coin_type.backingCoinType];

            blocktradesBackedCoins.push({
                name: coins_by_type[coin_type.backingCoinType].name,
                intermediateAccount: coins_by_type[coin_type.backingCoinType].intermediateAccount,
                gateFee: coins_by_type[coin_type.backingCoinType].gateFee,
                walletType: coins_by_type[coin_type.backingCoinType].walletType,
                backingCoinType: coins_by_type[coin_type.backingCoinType].walletSymbol,
                symbol: coin_type.walletSymbol,
                supportsMemos: coins_by_type[coin_type.backingCoinType].supportsOutputMemos,
                depositAllowed: isDepositAllowed,
                withdrawalAllowed: isWithdrawalAllowed
            });
        }});
    return blocktradesBackedCoins;
}

export function validateAddress({url = blockTradesAPIs.BASE, walletType, newAddress}) {
    if (!newAddress) return new Promise((res) => res());
    return fetch(
        url + "/wallets/" + walletType + "/address-validator?address=" + encodeURIComponent(newAddress),
        {
            method: "get",
            headers: new Headers({"Accept": "application/json"})
        }).then(reply => reply.json().then( json => json.isValid))
        .catch(err => {
            console.log("validate error:", err);
        });
}

let _conversionCache = {};
export function getConversionJson(inputs) {
    const { input_coin_type, output_coin_type, url, account_name } = inputs;
    if (!input_coin_type || !output_coin_type) return Promise.reject();
    const body = JSON.stringify({
        inputCoinType: input_coin_type,
        outputCoinType: output_coin_type,
        outputAddress: account_name,
        inputMemo: "blocktrades conversion: " + input_coin_type + "to" + output_coin_type
    });

    const _cacheString = url + input_coin_type + output_coin_type + account_name;
    return new Promise((resolve, reject) => {
        if (_conversionCache[_cacheString]) return resolve(_conversionCache[_cacheString]);
        fetch(url + "/simple-api/initiate-trade", {
            method:"post",
            headers: new Headers({"Accept": "application/json", "Content-Type": "application/json"}),
            body: body
        }).then(reply => { reply.json()
            .then( json => {
                _conversionCache[_cacheString] = json;
                resolve(json);
            }, reject)
            .catch(reject);
        }).catch(reject);
    });
}

function hasWithdrawalAddress(wallet) {
    return blockTradesStorage.has(`history_address_${wallet}`);
}

function setWithdrawalAddresses({wallet, addresses}) {
    blockTradesStorage.set(`history_address_${wallet}`, addresses);
}

function getWithdrawalAddresses(wallet) {
    return blockTradesStorage.get(`history_address_${wallet}`, []);
}

function setLastWithdrawalAddress({wallet, address}) {
    blockTradesStorage.set(`history_address_last_${wallet}`, address);
}

function getLastWithdrawalAddress(wallet) {
    return blockTradesStorage.get(`history_address_last_${wallet}`, "");
}

export const WithdrawAddresses = {
    has: hasWithdrawalAddress,
    set: setWithdrawalAddresses,
    get: getWithdrawalAddresses,
    setLast: setLastWithdrawalAddress,
    getLast: getLastWithdrawalAddress
};
