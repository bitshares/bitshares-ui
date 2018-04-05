import {ChainStore} from "bitsharesjs/es";
import utils from "./utils";
import counterpart from "counterpart";
import {estimateFee} from "./trxHelper";

export default class AccountUtils {
    /**
     *  takes asset as immutable object or id, fee as integer amount
     *  @return undefined if asset is undefined
     *  @return false if fee pool has insufficient balance
     *  @return true if the fee pool has sufficient balance
     */
    static checkFeePool(asset, fee) {
        asset = asset.toJS ? asset : ChainStore.getAsset(asset);
        if (!asset) return undefined;

        const dynamicObject = ChainStore.getObject(
            asset.get("dynamic_asset_data_id")
        );
        if (!dynamicObject) return undefined;

        let feePool = parseInt(dynamicObject.get("fee_pool"), 10);

        return feePool >= fee;
    }

    static getPossibleFees(account, operation) {
        let core = ChainStore.getAsset("1.3.0");
        account =
            !account || account.toJS ? account : ChainStore.getAccount(account);

        if (!account || !core) {
            return {assets: ["1.3.0"], fees: {"1.3.0": 0}};
        }

        let assets = [],
            fees = {};

        let globalObject = ChainStore.getObject("2.0.0");

        let fee = estimateFee(operation, null, globalObject);

        let accountBalances = account.get("balances");
        if (!accountBalances) {
            return {assets: ["1.3.0"], fees: {"1.3.0": 0}};
        }

        accountBalances.forEach((balanceID, assetID) => {
            let balanceObject = ChainStore.getObject(balanceID);
            let balance = balanceObject
                ? parseInt(balanceObject.get("balance"), 10)
                : 0;
            let hasBalance = false,
                eqFee;

            if (assetID === "1.3.0" && balance >= fee) {
                hasBalance = true;
            } else if (balance && ChainStore.getAsset(assetID)) {
                let asset = ChainStore.getAsset(assetID);
                let price = utils.convertPrice(
                    core,
                    asset.getIn(["options", "core_exchange_rate"]).toJS(),
                    null,
                    asset.get("id")
                );

                eqFee = parseInt(
                    utils.convertValue(price, fee, core, asset),
                    10
                );
                if (parseInt(eqFee, 10) !== eqFee) {
                    eqFee += 1; // Add 1 to round up;
                }
                if (balance >= eqFee && this.checkFeePool(asset, eqFee)) {
                    hasBalance = true;
                }
            }
            if (hasBalance) {
                assets.push(assetID);
                fees[assetID] = eqFee ? eqFee : fee;
            }
        });

        return {assets, fees};
    }

    static getFinalFeeAsset(account, operation, fee_asset_id = "1.3.0") {
        let {assets: feeAssets} = this.getPossibleFees(account, operation);
        if (feeAssets.length === 1) {
            fee_asset_id = feeAssets[0];
        } else if (
            feeAssets.length > 0 &&
            feeAssets.indexOf(fee_asset_id) === -1
        ) {
            fee_asset_id = feeAssets[0];
        }

        return fee_asset_id;
    }

    static isKnownScammer(account) {
        const scamAccountsPolo = [
            "polonie-wallet",
            "polonie-xwallet",
            "poloniewallet",
            "poloniex-deposit",
            "poloniex-wallet",
            "poloniexwall-et",
            "poloniexwallett",
            "poloniexwall-t",
            "poloniexwalle",
            "poloniex",
            "poloneix"
        ];

        const scamAccountsBittrex = [
            "bittrex-deopsit",
            "bittrex-deposi",
            "bittrex-depositt",
            "bittrex-dposit",
            "bittrex",
            "bittrex-deposits"
        ];

        const scamAccountsOther = [
            "coinbase",
            "blocktrade",
            "locktrades",
            "yun.bts",
            "transwiser-walle",	
            "transwiser-wallets",
            "ranswiser-wallet",
            "yun.btc",
            "pay.coinbase.com",
            "pay.bts.com",
            "btc38.com",
            "yunbi.com",
            "coinbase.com",
            "ripple.com",
            "livecoi-net",
            "livecoin.net",
            "livecoinnet"
        ];

        let scamMessage = null;
        if (scamAccountsPolo.indexOf(account) !== -1) {
            scamMessage = counterpart.translate("account.polo_scam");
        } else if (scamAccountsBittrex.indexOf(account) !== -1) {
            scamMessage = counterpart.translate("account.bittrex_scam");
        } else if (scamAccountsOther.indexOf(account) !== -1) {
            scamMessage = counterpart.translate("account.other_scam");
        }
        return scamMessage;
    }
}
