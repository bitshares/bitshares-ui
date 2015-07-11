var BaseStore = require("./BaseStore");
var Immutable = require("immutable");
import alt from "../alt-instance";
var VoteActions = require("../actions/VoteActions");
var AccountActions = require("../actions/AccountActions");
var AccountStore = require("../stores/AccountStore");
var Utils = require("common/utils");

const DELEGATE = 0;
const WITNESS = 1;
const BUDGET_ITEM = 2;

class VoteStore extends BaseStore {

    constructor() {
        super();
        this.i_proxies = {};
        this.i_delegates = {};
        this.i_witnesses = {};
        this.i_budget_items = {};
        this.c_proxies = {};
        this.c_delegates = {};
        this.c_witnesses = {};
        this.c_budget_items = {};
        this.cachedAccountsJson = {};
        this.bindActions(VoteActions);
        this.bindListeners({
            onGetAccount: AccountActions.getAccount
        });
        this._export("hasChanges", "getAccountJsonWithChanges");
    }

    initContainer(i_container, c_container, account_name) {
        let items = Immutable.List();
        i_container[account_name] = items;
        c_container[account_name] = items;
    }

    storeItem(i_container, c_container, account_name, account_obj) {
        let items = c_container[account_name];
        items = items.push(account_obj);
        if (i_container) i_container[account_name] = items;
        c_container[account_name] = items;
    }

    listToVoteOptions(vt, list, account_name_to_id) {
        let res = [];
        for (let v of list) {
            let account_id = account_name_to_id[v.name];
            if (account_id) {
                res.push(`${vt}:${Utils.get_object_id(account_id)}`);
            }
        }
        return res;
    }

    hasChanges(account_name) {
        return this.i_delegates[account_name] !== this.c_delegates[account_name] ||
            this.i_witnesses[account_name] !== this.c_witnesses[account_name] ||
            this.i_budget_items[account_name] !== this.c_budget_items[account_name] ||
            this.i_proxies[account_name] !== this.c_proxies[account_name];
    }

    getAccountJsonWithChanges(account_name) {
        let account_name_to_id = AccountStore.getState().account_name_to_id;
        let votes = []
            .concat(this.listToVoteOptions(DELEGATE, this.c_delegates[account_name], account_name_to_id))
            .concat(this.listToVoteOptions(WITNESS, this.c_witnesses[account_name], account_name_to_id))
            .concat(this.listToVoteOptions(BUDGET_ITEM, this.c_budget_items[account_name], account_name_to_id));
        //let account_store_data = AccountStore.getState();
        //let account =  account_store_data.cachedAccounts.get(account_store_data.account_name_to_id[account_name]).toJSON();
        let account = this.cachedAccountsJson[account_name];
        account.new_options = account.options;
        account.new_options.votes = votes;
        if(this.c_proxies[account_name]) {
            let account_id = account_name_to_id[this.c_proxies[account_name]];
            account.new_options.voting_account = account_id;
        }
        //AccountActions.transactUpdateAccount(account);
        return account;
    }

    onAddItem(data) {
        let container = this["c_" + data.container_name];
        let account_obj = {id: null, name: data.item.name};
        this.storeItem(null, container, data.account_name, account_obj);
    }

    onRemoveItem(data) {
        let container = this["c_" + data.container_name];
        let items = container[data.account_name];
        let index = items.findIndex(i => i.name === data.item.name);
        if (index >= 0) {
            container[data.account_name] = items.delete(index);
        }
    }

    onSetProxyAccount(data) {
        this.c_proxies[data.account_name] = data.proxy_account_name;
    }

    onCancelChanges(account_name) {
        console.log("[VoteStore.js:34] ----- onCancelChanges ----->");
        this.c_delegates[account_name] = this.i_delegates[account_name];
        this.c_witnesses[account_name] = this.i_witnesses[account_name];
        this.c_budget_items[account_name] = this.i_budget_items[account_name];
        this.c_proxies[account_name] = this.i_proxies[account_name];
    }

    onGetAccount(result) {
        if (result.sub) return;
        let account_id_to_name = AccountStore.getState().account_id_to_name;
        let account = result[0][0];
        this.cachedAccountsJson[account.name] = account;
        this.initContainer(this.i_delegates, this.c_delegates, account.name);
        this.initContainer(this.i_witnesses, this.c_witnesses, account.name);
        this.initContainer(this.i_budget_items, this.c_budget_items, account.name);
        for (let v of account.options.votes) {
            let [vt, vk] = v.split(":");
            let account_id = "1.2." + vk;
            let account_name = account_id_to_name[account_id];
            let account_obj = {id: account_id, name: account_name};
            if (vt == DELEGATE) this.storeItem(this.i_delegates, this.c_delegates, account.name, account_obj);
            if (vt == WITNESS) this.storeItem(this.i_witnesses, this.c_witnesses, account.name, account_obj);
            if (vt == BUDGET_ITEM) this.storeItem(this.i_budget_items, this.c_budget_items, account.name, account_obj);
        }
        let proxy_id = account.options.voting_account;
        if (proxy_id && proxy_id !== "1.2.0") {
            let proxy_name = account_id_to_name[proxy_id];
            let account_obj = {id: proxy_id, name: proxy_name};
            this.i_proxies[account.name] = account_obj;
            this.c_proxies[account.name] = account_obj;
        } else {
            this.c_proxies[account.name] = this.i_proxies[account.name] = "";
        }
    }

    onPublishChanges(account_name) {
        console.log("[VoteStore.js] ----- onTransactUpdateAccount ----->", account_name);
        this.i_delegates[account_name] = this.c_delegates[account_name];
        this.i_witnesses[account_name] = this.c_witnesses[account_name];
        this.i_budget_items[account_name] = this.c_budget_items[account_name];
        this.i_proxies[account_name] = this.c_proxies[account_name];
    }

}

module.exports = alt.createStore(VoteStore, "VoteStore");
