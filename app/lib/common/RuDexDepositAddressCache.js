import WalletDb from "stores/WalletDb";

class RuDexDepositAddressCache {
    constructor()
    {
        // increment this to force generating new addresses for all mappings
        this.current_rudex_address_cache_version_string = "1";
    }

    getIndexForDepositKeyInExchange(account_name, input_coin_type, output_coin_type)
    {
        let args = [this.current_rudex_address_cache_version_string, account_name, input_coin_type, output_coin_type];
        return args.reduce(function(previous, current) { return previous.concat("[", current, "]"); }, "");
    }

    // returns {"address": address, "memo": memo}, with a null memo if not applicable
    getCachedInputAddress(exchange_name, account_name, input_coin_type, output_coin_type)
    {
        let wallet = WalletDb.getWallet();
        if (!wallet) return null;
        wallet.deposit_keys = wallet.deposit_keys || {};
        wallet.deposit_keys[exchange_name] = wallet.deposit_keys[exchange_name] || {};
        let index = this.getIndexForDepositKeyInExchange(account_name, input_coin_type, output_coin_type);
        wallet.deposit_keys[exchange_name][index] = wallet.deposit_keys[exchange_name][index] || [];

        let number_of_keys = wallet.deposit_keys[exchange_name][index].length;
        if (number_of_keys)
            return wallet.deposit_keys[exchange_name][index][number_of_keys - 1];
        return null;
    }

    cacheInputAddress(exchange_name, account_name, input_coin_type, output_coin_type, address, memo)
    {
        let wallet = WalletDb.getWallet();
        if (!wallet) return null;
        wallet.deposit_keys = wallet.deposit_keys || {};
        wallet.deposit_keys[exchange_name] = wallet.deposit_keys[exchange_name] || {};
        let index = this.getIndexForDepositKeyInExchange(account_name, input_coin_type, output_coin_type);
        wallet.deposit_keys[exchange_name][index] = wallet.deposit_keys[exchange_name][index] || [];
        wallet.deposit_keys[exchange_name][index].push({"address": address, "memo": memo});
        WalletDb._updateWallet();
    }

}; // RuDexDepositAddressCache

export default RuDexDepositAddressCache;
