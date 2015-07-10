var alt = require("../alt-instance");

class VoteActions {

    addItem(container_name, account_name, item) {
        this.dispatch({container_name, account_name, item});
    }

    removeItem(container_name, account_name, item) {
        this.dispatch({container_name, account_name, item});
    }

    setProxyAccount(account_name, proxy_account) {
        console.log("[VoteActions.js:18] ----- setProxyAccount ----->", account_name, proxy_account);
        this.dispatch({
            account: account_name,
            proxy: proxy_account
        });
    }

    publishChanges(account_name) {
        this.dispatch(account_name);
    }

    transactChanges(account_name) {
        this.dispatch(account_name);
    }

    cancelChanges(account_name) {
        this.dispatch(account_name);
    }

}

module.exports = alt.createActions(VoteActions);
