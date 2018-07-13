import ss from "common/localStorage";

const session = new ss("__gdex__user_");

class GdexCache {
    constructor() {
        this.current_gdex_address_cache_version_string = "1";
        this.day = 86400;
    }

    getUserInfo(user_account) {
        let user_info = session.get(user_account, null);
        if (!user_info) return null;
        let cur_time = Math.floor(new Date().getTime() / 1000);
        // User info expire time set to 1 day
        if (Math.abs(user_info.ctime - cur_time) > this.day) {
            session.remove(user_account);
            return null;
        }
        return user_info;
    }

    cacheUserInfo(user_account, user_id, status) {
        let user_info = session.get(user_account, {});
        if (user_info != {}) {
            user_info = {
                user_id: user_id,
                status: status,
                ctime: Math.floor(new Date().getTime() / 1000)
            };
            session.set(user_account, user_info);
        }
    }

    delUserInfo(user_account) {
        if (session.has(user_account)) session.del(user_account);
    }

    getIndexForDepositKey(account_name, input_coin_type, output_coin_type) {
        let args = [
            this.current_gdex_address_cache_version_string,
            account_name,
            input_coin_type,
            output_coin_type
        ];
        return args.reduce(function(previous, current) {
            return previous.concat("[", current, "]");
        }, "");
    }

    getCachedInputAddress(account_name, input_coin_type, output_coin_type) {
        const index = this.getIndexForDepositKey(
            account_name,
            input_coin_type,
            output_coin_type
        );
        let deposit_keys = session.get("deposit_keys", {});
        let result = deposit_keys[index] || null;
        if (!result) return;
        if (result.address) {
            // cache deposit address for 1 week
            let cur_time = Math.floor(new Date().getTime() / 1000);
            if (Math.abs(result.ctime - cur_time) > this.day) {
                this.clearInputAddress(
                    account_name,
                    input_coin_type,
                    output_coin_type
                );
                return null;
            }
            return result;
        }
        return null;
    }

    cacheInputAddress(
        account_name,
        input_coin_type,
        output_coin_type,
        address,
        memo
    ) {
        const index = this.getIndexForDepositKey(
            account_name,
            input_coin_type,
            output_coin_type
        );
        let deposit_keys = session.get("deposit_keys", {});
        deposit_keys[index] = {
            address: address,
            memo: memo,
            ctime: Math.floor(new Date().getTime() / 1000)
        };
        session.set("deposit_keys", deposit_keys);
    }

    clearInputAddress(account_name, input_coin_type, output_coin_type) {
        const index = this.getIndexForDepositKey(
            account_name,
            input_coin_type,
            output_coin_type
        );
        let deposit_keys = session.get("deposit_keys", null);
        if (!deposit_keys) return;
        if (!deposit_keys[index]) {
            // Deposit key is empty, no need to clear
            return;
        }
        deposit_keys[index] = {address: null, memo: null, ctime: null};
        session.set("deposit_keys", deposit_keys);
    }
}

export default GdexCache;
