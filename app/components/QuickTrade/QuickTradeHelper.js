import utils from "common/utils";
import {ChainStore} from "bitsharesjs";
import {checkFeeStatusAsync} from "common/trxHelper";

// Returns a list of dicts with keys id, seller amount and price and respective values
function getOrders(amount, orders, whatAmount) {
    const matchedOrders = [];
    let totalAmount;
    orders.sort((a, b) => {
        return b.getPrice() - a.getPrice(); // getPrice === _real_price
    });

    for (let i = 0; i < orders.length; i++) {
        if (matchedOrders.length) {
            matchedOrders.forEach(({order}) => {
                totalAmount =
                    whatAmount === "receive"
                        ? order.total_for_sale.getAmount()
                        : order.total_to_receive.getAmount();
            });

            if (totalAmount >= amount) {
                break;
            } else {
                matchedOrders.push({
                    order: orders[i],
                    amount: orders[i].amountToReceive().amount,
                    total_amount: orders[i].total_to_receive.amount,
                    price: orders[i].getPrice()
                });
            }
        } else {
            matchedOrders.push({
                order: orders[i],
                amount: orders[i].amountToReceive().amount,
                total_amount: orders[i].total_to_receive.amount,
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
    return {
        latestPrice: latestPrice ? latestPrice : null,
        feedPrice: feedPrice ? feedPrice.toReal() : feedPrice
    };
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

// Returns a dict with keys liquidityPenalty, marketFee and transactionFee, input is selected assets and amounts
async function getFees(baseAsset, quoteAsset, currentAccount) {
    const baseMarketFeePercent =
        baseAsset.getIn(["options", "market_fee_percent"]) / 100 + "%";
    const quoteMarketFeePercent =
        quoteAsset.getIn(["options", "market_fee_percent"]) / 100 + "%";
    const baseMarketFee = baseAsset.getIn(["options", "market_fee_percent"]);
    const quoteMarketFee = quoteAsset.getIn(["options", "market_fee_percent"]);

    const trxFee = await checkFeeStatus(
        [baseAsset, quoteAsset],
        currentAccount
    );

    return {
        marketFee: {
            baseMarketFeePercent,
            quoteMarketFeePercent,
            baseMarketFee,
            quoteMarketFee
        },
        transactionFee: trxFee
    };
}

async function checkFeeStatus(assets = [], account) {
    let feeStatus = {};
    let p = [];
    assets.forEach(a => {
        p.push(
            checkFeeStatusAsync({
                accountID: account.get("id"),
                feeID: a.get("id"),
                type: "limit_order_create"
            })
        );
    });
    return Promise.all(p)
        .then(status => {
            assets.forEach((a, idx) => {
                feeStatus[a.get("id")] = status[idx];
            });
            return feeStatus;
        })
        .catch(err => {
            console.error("checkFeeStatusAsync error", err);
            return feeStatus;
        });
}

export {getOrders, getPrices, getFees, getAssetsToSell};
