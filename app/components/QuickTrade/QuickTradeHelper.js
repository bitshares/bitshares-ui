import utils from "common/utils";
import {ChainStore} from "bitsharesjs";
import AssetActions from "actions/AssetActions";

// Returns a list of dicts with keys id, seller amount and price and respective values, input is selected assets and amount to sell
function getOrders(assets, amount) {
    return {};
}

// Returns a dict with keys feedPrice and lastPrice and respective values, input is selected assets and amounts
function getPrices(assets, amounts) {
    // feed price
    // last price
    return {};
}

// Returns a dict with keys liquidityPenalty, marketFee and transactionFee, input is selected assets and amounts
function getFees(assets, amounts) {
    return {};
}

// Returns a list of asset ids that the user can sell
function getAssetsToSell(account) {
    let assetTypes = [];

    if (!(account && account.get("balances"))) {
        return assetTypes;
    }
    // "vesting_balances" ?
    let accountBalances = account.get("balances").toJS();

    assetTypes = Object.keys(accountBalances).sort(utils.sortID);

    for (let key in accountBalances) {
        let balanceObject = ChainStore.getObject(accountBalances[key]);
        if (balanceObject && balanceObject.get("balance") === 0) {
            assetTypes.splice(assetTypes.indexOf(key), 1);
        }
    }

    return assetTypes;
}

// Returns a list of asset ids that the user can buy, input is selected asset to sell
function getAssetsToReceive(asset) {
    // Какие есть виды асетов?
    // Как понять что можно купить асет?
    // Вернуть все
    // Применить фильтрI h
    AssetActions.getAssetList.defer(asset, 100);
}

export {getOrders, getPrices, getFees, getAssetsToSell, getAssetsToReceive};
