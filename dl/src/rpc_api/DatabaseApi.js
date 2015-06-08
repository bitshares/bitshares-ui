
var AccountActions = require('../actions/AccountActions')

class DatabaseApi {

    constructor(api) {
        this.api = api;
        this.accounts = {
            add: AccountActions.addAccount,
            get: function() { return AccountStore.getState().accounts; }
        };
    }

    get_block(block_id) {
        return this.api.exec("get_block", [block_id]).then(response => {
            console.log("----- get_block response ----->\n", response);
        });
    }

    get_accounts(accounts) {
        if ( ! Array.isArray(accounts))
            accounts = [accounts];

        var is_id = /^\d/.test(accounts[0])
        if(is_id)
            return this.api.exec("get_accounts", [accounts]).then(response => {
                console.log("----- get_accounts response ----->\n", response);
            });
        else
            return this.api.exec("lookup_account_names", [accounts]).then(response => {
                console.log("----- lookup_account_names response ----->\n", response);
            });
    }

    get_account_balances(account_id, assets) {
        return this.api.exec("get_account_balances", [[account_id, assets]]).then(response => {
            console.log("----- get_account_balances response ----->\n", response);
        });
    }

    get_objects(ids) {
        return this.api.exec("get_objects", [ids]).then(response => {
            return response;
        });
    }

    object(id) {
        return this.get_objects([id]).then(response => {
            return response && response.length > 0 ? response[0] : null;
        });
    }

}
module.exports = DatabaseApi
