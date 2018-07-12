import alt from "alt-instance";
import iDB from "idb-instance";
import Immutable from "immutable";
import BaseStore from "./BaseStore";
import {ChainStore} from "bitsharesjs/es";
import {Apis} from "bitsharesjs-ws";
import PrivateKeyStore from "stores/PrivateKeyStore";
import PrivateKeyActions from "actions/PrivateKeyActions";
import chainIds from "chain/chainIds";

class AccountRefsStore extends BaseStore {
    constructor() {
        super();
        this._export("loadDbData", "getAccountRefs");
        this.state = this._getInitialState();
        this.bindListeners({onAddPrivateKey: PrivateKeyActions.addKey});
        this.no_account_refs = Immutable.Set(); // Set of account ids
        ChainStore.subscribe(this.chainStoreUpdate.bind(this));
    }

    _getInitialState() {
        this.chainstore_account_ids_by_key = null;
        this.chainstore_account_ids_by_account = null;
        let account_refs = new Immutable.Map();
        account_refs = account_refs.set(this._getChainId(), Immutable.Set());
        return {
            account_refs
        };
    }

    getAccountRefs(chainId = this._getChainId()) {
        return this.state.account_refs.get(chainId, Immutable.Set());
    }

    _getChainId() {
        return Apis.instance().chain_id || chainIds.MAIN_NET;
    }

    onAddPrivateKey({private_key_object}) {
        if (
            ChainStore.getAccountRefsOfKey(private_key_object.pubkey) !==
            undefined
        )
            this.chainStoreUpdate();
    }

    loadDbData() {
        this.chainstore_account_ids_by_key = null;
        this.chainstore_account_ids_by_account = null;
        this.no_account_refs = Immutable.Set();

        let account_refs = new Immutable.Map();
        account_refs = account_refs.set(this._getChainId(), Immutable.Set());
        this.state = {account_refs};
        return loadNoAccountRefs()
            .then(no_account_refs => (this.no_account_refs = no_account_refs))
            .then(() => this.chainStoreUpdate());
    }

    chainStoreUpdate() {
        if (
            this.chainstore_account_ids_by_key ===
                ChainStore.account_ids_by_key &&
            this.chainstore_account_ids_by_account ===
                ChainStore.account_ids_by_account
        )
            return;
        this.chainstore_account_ids_by_key = ChainStore.account_ids_by_key;
        this.chainstore_account_ids_by_account =
            ChainStore.account_ids_by_account;
        this.checkPrivateKeyStore();
    }

    checkPrivateKeyStore() {
        let no_account_refs = this.no_account_refs;
        let temp_account_refs = Immutable.Set();
        PrivateKeyStore.getState()
            .keys.keySeq()
            .forEach(pubkey => {
                if (no_account_refs.has(pubkey)) return;
                let refs = ChainStore.getAccountRefsOfKey(pubkey);
                if (refs === undefined) return;
                if (!refs.size) {
                    // Performance optimization...
                    // There are no references for this public key, this is going
                    // to block it.  There many be many TITAN keys that do not have
                    // accounts for example.
                    {
                        // Do Not block brainkey generated keys.. Those are new and
                        // account references may be pending.
                        let private_key_object = PrivateKeyStore.getState().keys.get(
                            pubkey
                        );
                        if (
                            typeof private_key_object.brainkey_sequence ===
                            "number"
                        ) {
                            return;
                        }
                    }
                    no_account_refs = no_account_refs.add(pubkey);
                    return;
                }
                temp_account_refs = temp_account_refs.add(refs.valueSeq());
            });
        temp_account_refs = temp_account_refs.flatten();

        /* Discover accounts referenced by account name in permissions */
        temp_account_refs.forEach(account => {
            let refs = ChainStore.getAccountRefsOfAccount(account);
            if (refs === undefined) return;
            if (!refs.size) return;
            temp_account_refs = temp_account_refs.add(refs.valueSeq());
        });
        temp_account_refs = temp_account_refs.flatten();
        if (!this.getAccountRefs().equals(temp_account_refs)) {
            this.state.account_refs = this.state.account_refs.set(
                this._getChainId(),
                temp_account_refs
            );
            // console.log("AccountRefsStore account_refs",account_refs.size);
        }
        if (!this.no_account_refs.equals(no_account_refs)) {
            this.no_account_refs = no_account_refs;
            saveNoAccountRefs(no_account_refs);
        }
    }
}

export default alt.createStore(AccountRefsStore, "AccountRefsStore");

/*
*  Performance optimization for large wallets, no_account_refs tracks pubkeys
*  that do not have a corresponding account and excludes them from future api calls
*  to get_account_refs. The arrays are stored in the indexed db, one per chain id
*/
function loadNoAccountRefs() {
    let chain_id = Apis.instance().chain_id;
    let refKey = `no_account_refs${
        !!chain_id ? "_" + chain_id.substr(0, 8) : ""
    }`;
    return iDB.root.getProperty(refKey, []).then(array => Immutable.Set(array));
}

function saveNoAccountRefs(no_account_refs) {
    let array = [];
    let chain_id = Apis.instance().chain_id;
    let refKey = `no_account_refs${
        !!chain_id ? "_" + chain_id.substr(0, 8) : ""
    }`;
    for (let pubkey of no_account_refs) array.push(pubkey);
    iDB.root.setProperty(refKey, array);
}
