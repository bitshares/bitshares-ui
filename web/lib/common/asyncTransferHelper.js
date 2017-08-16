import { FetchChain } from "bitsharesjs/es";
import { Price, Asset } from "common/MarketClasses";
import utils from "common/utils";

function estimateFee(type, options = null) {
    return new Promise((res, rej) => {
        FetchChain("getObject", "2.0.0").then(obj => {
            res(utils.estimateFee(type, options, obj));
        }).catch(rej);
    });
}

function checkFeePool({assetID, type = "transfer", options = null} = {}) {
    return new Promise(res => {
        if (assetID === "1.3.0") {
            res(true);
        } else {
            Promise.all([
                estimateFee(type, options),
                FetchChain("getAsset", assetID)
            ])
            .then(result => {
                const [fee, feeAsset] = result;
                res(parseInt(feeAsset.getIn(["dynamic", "fee_pool"]), 10) >= fee);
            });
        }
    });
}

function checkFeePayment({accountID, feeID = "1.3.0", type = "transfer", options = null} = {}) {
    return new Promise((res, rej) => {
        Promise.all([
            estimateFee(type, options),
            checkFeePool({assetID: feeID, type, options}),
            FetchChain("getAccount", accountID),
            FetchChain("getAsset", "1.3.0"),
            feeID !== "1.3.0" ? FetchChain("getAsset", feeID) : null
        ])
        .then(result => {
            let [coreFee, hasPoolBalance, account, coreAsset, feeAsset] = result;
            if (feeID === "1.3.0") feeAsset = coreAsset;
            FetchChain("getObject", account.getIn(["balances", feeID])).then(balance => {
                let hasBalance = false;
                let fee = new Asset({amount: coreFee});

                /*
                ** If the fee is to be paid in a non-core asset, check the fee
                ** pool and convert the amount using the CER
                */
                if (feeID !== "1.3.0") {
                    // Check the fee pool of the asset
                    // if (parseInt(feeAsset.getIn(["dynamic", "fee_pool"]), 10) >= coreFee) hasPoolBalance = true;

                    // Convert the amount using the CER
                    let cer = feeAsset.getIn(["options", "core_exchange_rate"]);
                    let b = cer.get("base").toJS();
                    b.precision = b.asset_id === feeID ? feeAsset.get("precision") : coreAsset.get("precision");
                    let base = new Asset(b);

                    let q = cer.get("quote").toJS();
                    q.precision = q.asset_id === feeID ? feeAsset.get("precision") : coreAsset.get("precision");
                    let quote = new Asset(q);

                    let price = new Price({base, quote});
                    fee = fee.times(price, true);
                } else {
                    hasPoolBalance = true; // Core asset needs no pool balance, set to true for logic
                }

                if (balance.get("balance") >= fee.getAmount()) hasBalance = true;

                res({fee, hasBalance, hasPoolBalance});
            });
        }).catch(rej);
    });
}

export {
    estimateFee,
    checkFeePool,
    checkFeePayment
};
