import React from "react";
import Immutable from "immutable";
import {PropTypes} from "react";
import Translate from "react-translate-component";
import AutocompleteInput from "../Forms/AutocompleteInput";
import Tabs from "react-foundation-apps/src/tabs";
import counterpart from "counterpart";
import LoadingIndicator from "../LoadingIndicator";
import AccountSelector from "./AccountSelector";
import utils from "common/utils";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "stores/WalletDb.js"
import ChainStore from "api/ChainStore";
import validation from "common/validation"
import AccountImage from "./AccountImage";
import WorkerApproval from "./WorkerApproval";
import {FetchChainObjects} from "api/ChainStore";

import AccountPermissionsList from "./AccountPermissionsList";

let wallet_api = new WalletApi()

class AccountPermissions extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired // the account object that should be updated
    }

    constructor(props) {
        super(props);
        this.state = {
            active_accounts: new Immutable.List(),
            active_keys: new Immutable.List(),
            owner_accounts: new Immutable.List(),
            owner_keys: new Immutable.List(),
            active_thresholds: {},
            owner_thresholds: {}
        };
        this.onPublish = this.onPublish.bind(this);
    }

    updateAccountData(account) {
        //let options = account.get('options');
        //let proxy_account_id = options.get('voting_account');
        //if(proxy_account_id === "1.2.5" ) proxy_account_id = "";
        //let votes = options.get('votes');
        //let vote_ids = votes.toArray();
        //let vids = Immutable.Set( vote_ids );
        //ChainStore.getObjectsByVoteIds(vote_ids);
        //FetchChainObjects(ChainStore.getObjectByVoteID, vote_ids, 5000).then(vote_objs => {
        //    console.log( "Vote Objs: ", vote_objs );
        //    let witnesses = new Immutable.List();
        //    let committee = new Immutable.List();
        //    let workers = new Immutable.Set();
        //    vote_objs.forEach( obj => {
        //        let account_id = obj.get("committee_member_account");
        //        if (account_id) {
        //            committee = committee.push(account_id);
        //        } else if( account_id = obj.get( "worker_account" ) ) {
        //            console.log( "worker: ", obj );
        //            //     workers = workers.add(obj.get("id"));
        //        } else if( account_id = obj.get("witness_account") ) {
        //            witnesses = witnesses.push(account_id);
        //        }
        //    });
        //    let state = {
        //        proxy_account_id: proxy_account_id,
        //        witnesses: witnesses,
        //        committee: committee,
        //        workers: workers,
        //        vote_ids: vids,
        //        prev_proxy_account_id: proxy_account_id,
        //        prev_witnesses: witnesses,
        //        prev_committee: committee,
        //        prev_workers: workers,
        //        prev_vote_ids : vids
        //    };
        //    this.setState(state);
        //});
    }

    isChanged() {
        return false;
        //let s = this.state;
        //if( s.vote_ids ) console.log( "VoteIDs: ", s.vote_ids.toJS() )
        //if( s.prev_vote_ids ) console.log( "Prev VoteIDs: ", s.prev_vote_ids.toJS() )
        //return s.proxy_account_id !== s.prev_proxy_account_id ||
        //    s.witnesses !== s.prev_witnesses ||
        //    s.committee !== s.prev_committee ||
        //    !Immutable.is(s.vote_ids, s.prev_vote_ids);
    }

    componentWillMount() {
        this.updateAccountData(this.props.account);
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.account !== this.props.account) this.updateAccountData(this.props.account);
    }

    onPublish() {
        //let updated_account = this.props.account.toJS();
        //updated_account.account = updated_account.id;
        //updated_account.new_options = updated_account.options
        //let new_proxy_id = this.state.proxy_account_id;
        //updated_account.new_options.voting_account = new_proxy_id ? new_proxy_id : "1.2.5";
        //updated_account.new_options.num_witness = this.state.witnesses.size;
        //updated_account.new_options.num_committee = this.state.committee.size;
        //console.log( "vote_ids: ", this.state.vote_ids.toJS() );
        //FetchChainObjects(ChainStore.getWitnessById, this.state.witnesses.toArray(), 4000).then( res => {
        //    let witnesses_vote_ids = res.map(o => o.get("vote_id"));
        //    return Promise.all([Promise.resolve(witnesses_vote_ids), FetchChainObjects(ChainStore.getCommitteeMemberById, this.state.committee.toArray(), 4000)]);
        //}).then( res => {
        //    updated_account.new_options.votes = res[0]
        //        .concat(res[1].map(o => o.get("vote_id")))
        //        .concat(this.state.vote_ids.filter( id => id.split(":")[0] === "2" ).toArray() )
        //        .sort((a, b)=> { return parseInt(a.split(':')[1]) - parseInt(b.split(':')[1]) });
        //    console.log("updated_account: ", updated_account);
        //    var tr = wallet_api.new_transaction();
        //    tr.add_type_operation("account_update", updated_account);
        //    WalletDb.process_transaction(tr, null, true);
        //});
    }

    onAddItem(collection, item_value, threshold){
        console.log( "onAddItem: ", item_value, threshold );
        let state = {};
        let list = collection + (utils.is_object_id(item_value) ? "_accounts" : "_keys");
        state[list] = this.state[list].push(item_value);
        this.state[collection + "_thresholds"][item_value] = threshold;
        console.log("-- AccountPermissions.onAddItem -->", state);
        this.setState(state);
    }

    onRemoveItem(collection, item_value){
        console.log( "item_value: ", item_value );
        let state = {};
        let list = collection + (utils.is_object_id(item_value) ? "_accounts" : "_keys");
        state[list] = this.state[list].filter(i => i !== item_value);
        this.setState(state);
    }

    validateAccount(collection, account) {
        return null;
    }

    render() {
        let publish_buttons_class = "button" + (this.isChanged() ? "" : " disabled");
        return (
            <div className="grid-content">

                <div className="content-block">
                    <h3>Active Permissions</h3>
                    <AccountPermissionsList
                        label="account.perm.add_permission_label"
                        accounts={this.state.active_accounts}
                        keys={this.state.active_keys}
                        thresholds={this.state.active_thresholds}
                        validateAccount={this.validateAccount.bind(this, "active")}
                        onAddItem={this.onAddItem.bind(this, "active")}
                        onRemoveItem={this.onRemoveItem.bind(this, "active")}
                        placeholder={counterpart.translate("account.perm.account_name_or_key")}
                        tabIndex={1}/>
                </div>

                <div className="content-block">
                    <h3>Owner Permissions</h3>
                    <AccountPermissionsList
                        label="account.perm.add_permission_label"
                        accounts={this.state.owner_accounts}
                        keys={this.state.owner_keys}
                        thresholds={this.state.owner_thresholds}
                        validateAccount={this.validateAccount.bind(this, "owner")}
                        onAddItem={this.onAddItem.bind(this, "owner")}
                        onRemoveItem={this.onRemoveItem.bind(this, "owner")}
                        placeholder={counterpart.translate("account.perm.account_name_or_key")}
                        tabIndex={3}/>
                </div>

                <div className="content-block">
                    <button className={publish_buttons_class} onClick={this.onPublish} tabIndex={4}>
                        <Translate content="account.votes.publish"/></button>
                </div>
            </div>
        )
    }
}

export default AccountPermissions;
