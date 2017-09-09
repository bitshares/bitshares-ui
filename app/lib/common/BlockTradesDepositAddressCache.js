import WalletDb from "stores/WalletDb";
import ls from "common/localStorage";
const ss = new ls("__bts__");

class BlockTradesDepositAddressCache {
    constructor()
    {
        // increment this to force generating new addresses for all mappings
        this.current_blocktrades_address_cache_version_string = "2";

        //let wallet = WalletDb.getWallet();
        //delete wallet.deposit_keys["blocktrades"];
        //delete wallet.deposit_keys["openledger"];
        //WalletDb._updateWallet();
    }

    getIndexForDepositKeyInExchange(account_name, input_coin_type, output_coin_type)
    {
        let args = [this.current_blocktrades_address_cache_version_string, account_name, input_coin_type, output_coin_type];
        return args.reduce(function(previous, current) { return previous.concat("[", current, "]"); }, "");
    }

    // returns {"address": address, "memo": memo}, with a null memo if not applicable
    getCachedInputAddress(exchange_name, account_name, input_coin_type, output_coin_type)
    {
        let wallet = WalletDb.getWallet();
        wallet = null;

        const index = this.getIndexForDepositKeyInExchange(account_name, input_coin_type, output_coin_type);
        if (!wallet) {
            let deposit_keys = ss.get("deposit_keys", {});
            deposit_keys[exchange_name] = deposit_keys[exchange_name] || {};
            deposit_keys[exchange_name][index] = deposit_keys[exchange_name][index] || [];
            let number_of_keys = deposit_keys[exchange_name][index].length;
            if (number_of_keys)
                return deposit_keys[exchange_name][index][number_of_keys - 1];
            return null;
        } else {
            wallet.deposit_keys = wallet.deposit_keys || {};
            wallet.deposit_keys[exchange_name] = wallet.deposit_keys[exchange_name] || {};
            wallet.deposit_keys[exchange_name][index] = wallet.deposit_keys[exchange_name][index] || [];

            let number_of_keys = wallet.deposit_keys[exchange_name][index].length;
            if (number_of_keys)
                return wallet.deposit_keys[exchange_name][index][number_of_keys - 1];
            return null;
        }
    }

    cacheInputAddress(exchange_name, account_name, input_coin_type, output_coin_type, address, memo)
    {
        let wallet = WalletDb.getWallet();
        wallet = null;

        const index = this.getIndexForDepositKeyInExchange(account_name, input_coin_type, output_coin_type);
        if (!wallet) {
            let deposit_keys = ss.get("deposit_keys", {});
            deposit_keys[exchange_name] = deposit_keys[exchange_name] || {};
            deposit_keys[exchange_name][index] = deposit_keys[exchange_name][index] || [];
            deposit_keys[exchange_name][index].push({"address": address, "memo": memo});
            ss.set("deposit_keys", deposit_keys);
        } else {
            wallet.deposit_keys = wallet.deposit_keys || {};
            wallet.deposit_keys[exchange_name] = wallet.deposit_keys[exchange_name] || {};
            wallet.deposit_keys[exchange_name][index] = wallet.deposit_keys[exchange_name][index] || [];
            wallet.deposit_keys[exchange_name][index].push({"address": address, "memo": memo});
            WalletDb._updateWallet();
        }

    }

}; // BlockTradesDepositAddressCache

export default BlockTradesDepositAddressCache;
