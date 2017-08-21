import { FetchChain, PrivateKey, Aes, TransactionHelper, ChainTypes, ops } from "bitsharesjs/es";
import { Price, Asset } from "common/MarketClasses";
const { operations } = ChainTypes;

function estimateFeeAsync(type, options = null, data = {}) {
    return new Promise((res, rej) => {
        FetchChain("getObject", "2.0.0").then(obj => {
            res(estimateFee(type, options, obj, data));
        }).catch(rej);
    });
}

function checkFeePoolAsync({assetID, type = "transfer", options = null, data} = {}) {
    return new Promise(res => {
        if (assetID === "1.3.0") {
            res(true);
        } else {
            Promise.all([
                estimateFeeAsync(type, options, data),
                FetchChain("getAsset", assetID)
            ])
            .then(result => {
                const [fee, feeAsset] = result;
                res(parseInt(feeAsset.getIn(["dynamic", "fee_pool"]), 10) >= fee);
            });
        }
    });
}

function checkFeeStatusAsync({accountID, feeID = "1.3.0", type = "transfer", options = null, data} = {}) {
    return new Promise((res, rej) => {
        Promise.all([
            estimateFeeAsync(type, options, data),
            checkFeePoolAsync({assetID: feeID, type, options, data}),
            FetchChain("getAccount", accountID),
            FetchChain("getAsset", "1.3.0"),
            feeID !== "1.3.0" ? FetchChain("getAsset", feeID) : null
        ])
        .then(result => {
            let [coreFee, hasPoolBalance, account, coreAsset, feeAsset] = result;
            let hasBalance = false;
            if (feeID === "1.3.0") feeAsset = coreAsset;
            let coreBalanceID = account.getIn(["balances", "1.3.0"]),
                feeBalanceID = account.getIn(["balances", feeID]);

            if (feeID === "1.3.0" && !coreBalanceID) return res({fee: new Asset({amount: coreFee}), hasBalance, hasPoolBalance});

            Promise.all([
                coreBalanceID ? FetchChain("getObject", coreBalanceID) : null,
                feeBalanceID ? FetchChain("getObject", feeBalanceID) : null
            ])
            .then(balances => {
                let [coreBalance, feeBalance] = balances;
                let fee = new Asset({amount: coreFee});
                let hasValidCER = true;

                /*
                ** If the fee is to be paid in a non-core asset, check the fee
                ** pool and convert the amount using the CER
                */
                if (feeID !== "1.3.0") {
                    // Convert the amount using the CER
                    let cer = feeAsset.getIn(["options", "core_exchange_rate"]);
                    let b = cer.get("base").toJS();
                    b.precision = b.asset_id === feeID ? feeAsset.get("precision") : coreAsset.get("precision");
                    let base = new Asset(b);

                    let q = cer.get("quote").toJS();
                    q.precision = q.asset_id === feeID ? feeAsset.get("precision") : coreAsset.get("precision");
                    let quote = new Asset(q);

                    /*
                    ** If the CER is incorrectly configured, the multiplication
                    ** will fail, so catch the error and default to core
                    */
                    try {
                        let price = new Price({base, quote});
                        fee = fee.times(price, true);
                    } catch(err) {
                        feeBalance = coreBalance;
                        hasValidCER = false;
                        hasPoolBalance = false;
                    }
                }

                if (feeBalance && feeBalance.get("balance") >= fee.getAmount()) hasBalance = true;

                res({fee, hasBalance, hasPoolBalance, hasValidCER});
            });
        }).catch(rej);
    });
}

const privKey = "5KikQ23YhcM7jdfHbFBQg1G7Do5y6SgD9sdBZq7BqQWXmNH7gqo";
const nonce = TransactionHelper.unique_nonce_uint64();
let _privKey;
let _cachedMessage, _prevContent;

function estimateFee(op_type, options, globalObject, data = {}) {
    if (!globalObject) return 0;
    let op_code = operations[op_type];
    let currentFees = globalObject.getIn(["parameters", "current_fees", "parameters", op_code, 1]).toJS();

    let fee = 0;
    if (currentFees.fee) {
        fee += currentFees.fee;
    }

    if (options) {
        for (let option of options) {
            const optionFee = currentFees[option];

            if (option === "price_per_kbyte") {
                if (data.type === "memo" && !!data.content) {
                    /* Dummy priv key */
                    let pKey = _privKey || PrivateKey.fromWif(privKey);
                    if (_privKey) _privKey = pKey;
                    let memoFromKey = "BTS6B1taKXkDojuC1qECjvC7g186d8AdeGtz8wnqWAsoRGC6RY8Rp";

                    // Memos are optional, but if you have one you need to encrypt it
                    let memoToKey = "BTS8eLeqSZZtB1YHdw7KjQxRSRmaKAseCxhUSqaLxUdqvdGpp6nck";

                    /* Encryption is very expensive so we cache the result for reuse */
                    let message;
                    if (data.content === _prevContent && _cachedMessage) {
                        message = _cachedMessage;
                    } else {
                        message = _cachedMessage = Aes.encrypt_with_checksum(
                            pKey,
                            memoToKey,
                            nonce,
                            data.content
                        );
                    }

                    let memo_object = {
                        from: memoFromKey,
                        to: memoToKey,
                        nonce,
                        message
                    };

                    let serialized = ops.memo_data.fromObject(memo_object);
                    const stringified = JSON.stringify(ops.memo_data.toHex(serialized));
                    const byteLength = Buffer.byteLength(stringified, "hex");
                    fee += (optionFee * byteLength / 1024);

                    _prevContent = data.content;
                }
            } else if (optionFee) {
                fee += optionFee;
            }
        }
    }

    return fee * globalObject.getIn(["parameters", "current_fees", "scale"]) / 10000;
}

function checkBalance(amount, sendAsset, feeAmount, balance) {

    if (!amount) return null;
    if (typeof amount === "string") amount = parseFloat(String.prototype.replace.call(amount, /,/g, ""));

    if (!balance || balance.get("balance") === 0) return false;

    let sendAmount = new Asset({
        asset_id: sendAsset.get("id"),
        precision: sendAsset.get("precision"),
        real: amount
    });
    let balanceAmount = sendAmount.clone(balance.get("balance"));

    /* Insufficient balance */
    if (balanceAmount.lt(sendAmount)) {
        return false;
    }

    /* Check if enough remains to pay the fee */
    if (sendAmount.asset_id === feeAmount.asset_id) {
        sendAmount.plus(feeAmount);
        if (balanceAmount.lt(sendAmount)) {
            return false;
        }
    }

    return true;
}

export {
    estimateFee,
    estimateFeeAsync,
    checkFeePoolAsync,
    checkFeeStatusAsync,
    checkBalance
};
