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
import FetchChainObject from "../Utility/FetchChainObject";

import AccountVotingProxy from "./AccountVotingProxy";
import AccountVotingItems from "./AccountVotingItems";

let wallet_api = new WalletApi()

class AccountVoting extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired // the account object that should be updated
    }

    constructor(props) {
        super(props);
        this.state = {
            proxy_account_id: "",//"1.2.16",
            witnesses: new Immutable.List(["1.2.10", "1.2.17", "1.2.1", "1.2.3"]),
            committee: new Immutable.List(["1.2.10", "1.2.17", "1.2.3"])
        };
        this.onProxyAccountChange = this.onProxyAccountChange.bind(this);
        this.onPublish = this.onPublish.bind(this);
    }

    updateAccountData(account) {
        console.log("-- AccountVoting.updateData -->", account);
        // TODO: extract data from account object here
        let state = {
            proxy_account_id: this.state.proxy_account_id,
            witnesses: this.state.witnesses,
            committee: this.state.committee,
            prev_proxy_account_id: this.state.proxy_account_id,
            prev_witnesses: this.state.witnesses,
            prev_committee: this.state.committee
        };
        this.setState(state);
    }

    isChanged() {
        let s = this.state;
        return s.proxy_account_id !== s.prev_proxy_account_id ||
               s.witnesses !== s.prev_witnesses ||
               s.committee !== s.prev_committee;
    }

    componentWillMount() {
        this.updateAccountData(this.props.account);
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.account !== this.props.account) this.updateAccountData();
    }

    onPublish() {
        // TODO: make the code below work
        //let updated_account = this.state.account.toJS()
        //updated_account.new_options = updated_account.options
        //let new_proxy_id = this.getNewProxyID()
        //updated_account.new_options.voting_account = new_proxy_id ? new_proxy_id : "1.2.0"
        //
        //let witness_votes = this.state.witnesses.map(item => {
        //    console.log("item:", item.toJS());
        //    return item.get('vote_id')
        //})
        //let committee_votes = this.state.committee.map(item => { return item.get('vote_id') })
        //updated_account.new_options.num_committee = committee_votes.size
        //updated_account.new_options.num_witness = witness_votes.size
        //updated_account.new_options.votes = witness_votes.concat(committee_votes).toArray()
        //updated_account.new_options.votes = updated_account.new_options.votes.sort((a, b)=> { return parseInt(a.split(':')[1]) - parseInt(b.split(':')[1]) })
        //console.log("SORTED VOTES: ", updated_account.new_options.votes)
        //
        //updated_account.account = updated_account.id
        //console.log("updated_account: ", updated_account)
        //
        //var tr = wallet_api.new_transaction();
        //tr.add_type_operation("account_update", updated_account);
        //WalletDb.process_transaction(tr, null, true)
    }

    onAddItem(collection, item_id){
        let state = {};
        state[collection] = this.state[collection].push(item_id);
        this.setState(state);
    }

    onRemoveItem(collection, item_id){
        let state = {};
        state[collection] = this.state[collection].filter(i => i !== item_id);
        this.setState(state);
    }

    onProxyAccountChange(proxy_account) {
        this.setState({proxy_account_id: proxy_account ? proxy_account.get("id") : ""});
    }

    validateAccount(collection, account) {
        console.log("-- AccountVoting.validateAccount -->", collection, account);
        if(!account) return null;
        if(collection === "witnesses") {
            // TODO: replace ChainStore.getObject with proper method
            return FetchChainObject(ChainStore.getObject, account.get("id"), 1000).then(res => {
                return res ? null : "Not a witness";
            });
        }
        if(collection === "committee") {
            // TODO: replace ChainStore.getObject with proper method
            return FetchChainObject(ChainStore.getObject, account.get("id"), 1000).then(res => {
                return res ? null : "Not a committee member";
            });
        }
        return null;
    }

    render() {
        console.log("-- AccountVoting.render -->", this.state.witnesses);
        let proxy_is_set = !!this.state.proxy_account_id;
        let publish_buttons_class = "button" + (this.isChanged() ? "" : " disabled");
        return (
            <div className="grid-content">
                <AccountVotingProxy
                    currentAccount={this.props.account}
                    proxyAccount={this.state.proxy_account_id}
                    onProxyAccountChanged={this.onProxyAccountChange}/>

                <div className={"content-block" + (proxy_is_set ? " disabled" : "")}>
                    <h3>Witnesses</h3>
                    <AccountVotingItems
                        label="account.votes.add_committee_label"
                        items={this.state.witnesses}
                        validateAccount={this.validateAccount.bind(this, "witnesses")}
                        onAddItem={this.onAddItem.bind(this, "witnesses")}
                        onRemoveItem={this.onRemoveItem.bind(this, "witnesses")}
                        tabIndex={proxy_is_set ? -1 : 2}/>
                </div>

                <div className={"content-block" + (proxy_is_set ? " disabled" : "")}>
                    <h3>Committee</h3>
                    <AccountVotingItems
                        label="account.votes.add_committee_label"
                        items={this.state.committee}
                        validateAccount={this.validateAccount.bind(this, "committee")}
                        onAddItem={this.onAddItem.bind(this, "committee")}
                        onRemoveItem={this.onRemoveItem.bind(this, "committee")}
                        tabIndex={proxy_is_set ? -1 : 3}/>
                </div>

                <div className="content-block">
                    <button className={publish_buttons_class} onClick={this.onPublish} tabIndex={4}>
                        <Translate content="account.votes.publish"/></button>
                </div>
            </div>
        )
    }
}

export default AccountVoting;
