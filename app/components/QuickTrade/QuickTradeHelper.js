import utils from "common/utils";
import {ChainStore} from "bitsharesjs";
import AssetActions from "actions/AssetActions";

// Returns a list of dicts with keys id, seller amount and price and respective values
function getOrders(amount, orders) {
    const matchedOrders = [];
    let totalAmount;
    orders.sort((a, b) => {
        return b.getPrice() - a.getPrice(); // getPrice === _real_price
    });

    for (let i = 0; i < orders.length; i++) {
        if (matchedOrders.length) {
            totalAmount = 0;
            matchedOrders.forEach(({order}) => {
                totalAmount += order.total_to_receive.getAmount();
            });

            if (totalAmount >= amount) {
                break;
            } else {
                matchedOrders.push({
                    order: orders[i],
                    amount: orders[i].total_to_receive.getAmount(),
                    price: orders[i].getPrice()
                });
            }
        } else {
            matchedOrders.push({
                order: orders[i],
                amount: orders[i].total_to_receive.getAmount(),
                price: orders[i].getPrice()
            });
        }
    }

    return matchedOrders;
}

// Returns a dict with keys feedPrice and lastPrice
function getPrices(activeMarketHistory, feedPrice) {
    let latestPrice;
    if (activeMarketHistory.size) {
        const latest_two = activeMarketHistory.take(2);
        const latest = latest_two.first();
        latestPrice = latest.getPrice();
    }
    // feed price === null if not a bitasset market
    return {latestPrice, feedPrice: feedPrice ? feedPrice.toReal() : feedPrice};
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
    AssetActions.getAssetList.defer(asset, 100);
}

export {getOrders, getPrices, getFees, getAssetsToSell, getAssetsToReceive};
