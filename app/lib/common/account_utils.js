import {ChainStore} from "bitsharesjs";
import utils from "./utils";
import counterpart from "counterpart";
import {estimateFee} from "./trxHelper";
import {
    scamAccountsPolo,
    scamAccountsBittrex,
    scamAccountsOther
} from "./scamAccounts";
import SettingsStore from "stores/SettingsStore";

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

    /**
     * Returns all assets that the user can actually use to pay the fee given by the operation.
     * This estimates the fee in core asset, checks user balance and fee pool of all balances
     * and decides which one may be used.
     */
    static getPossibleFees(account, operation, raiseIfInsufficient = false) {
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
        if (!accountBalances || Object.keys(accountBalances).length == 0) {
            return {assets: [], fees: {}};
        }

        for (const [assetID, balance] of Object.entries(
            this.getAccountBalances(account)
        )) {
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
        }

        // if requested, raise exception if no fees found
        if (raiseIfInsufficient && assets.length == 0) {
            throw "Insufficient balance for fee";
        }

        return {assets, fees};
    }

    /**
     * Returns the fee asset id that can be used to pay for the fee.
     * It will try to use the globally set preference, and if not possible the given
     * preference (usually defaults to core asset), and if also not possible,
     * just any asset of the user that has sufficient balance and has a funded feepool.
     * If nothing is available, it returns the globally set default, or raises an error.
     */
    static getFinalFeeAsset(
        account,
        operation,
        feeAssetId = "1.3.0",
        raiseIfInsufficient = false
    ) {
        // user can set a default in the settings
        let default_fee_asset_symbol = SettingsStore.getSetting("fee_asset");
        let default_fee_asset = ChainStore.getAsset(
            default_fee_asset_symbol
        ).toJS();
        let {assets: feeAssets} = this.getPossibleFees(
            account,
            operation,
            raiseIfInsufficient
        );
        if (feeAssets.length > 0) {
            if (
                feeAssets.indexOf(default_fee_asset.id) !== -1
            ) {
                return default_fee_asset.id;
            } else if (
                feeAssets.indexOf(feeAssetId) !== -1
            ) {
                return feeAssetId;
            } else {
                // take any that allows to pay the fee
                return feeAssets[0];
            }    
        } else {
            // can't pay fee, show user his chosen default
            return default_fee_asset.id;
        }
    }

    static getAccountBalances(account) {
        account =
            !account || account.toJS ? account : ChainStore.getAccount(account);
        let accountBalances = account.get("balances");
        let balances = {};
        accountBalances.forEach((balanceID, assetID) => {
            let balanceObject = ChainStore.getObject(balanceID);
            let balance = balanceObject
                ? parseInt(balanceObject.get("balance"), 10)
                : 0;
            balances[assetID] = balance;
        });
        return balances;
    }

    static isKnownScammer(account) {
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
