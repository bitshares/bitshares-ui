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

import AccountVotingProxy from "./AccountVotingProxy";
import AccountVotingItems from "./AccountVotingItems";

let wallet_api = new WalletApi()

class AccountVoting extends React.Component {

    static propTypes = {
        account: React.PropTypes.object.isRequired // the account object that should be updated
    }

    constructor(props) {
        super(props)
        this.state = {
            proxy_account: null, ///< the proxy used by the blockchain
            changed: false,
            witnesses: new Immutable.List(["1.2.10", "1.2.17", "1.2.1", "1.2.3"]),
            committee: new Immutable.Map(),
            init_witnesses: new Immutable.Map(),
            init_committee: new Immutable.Map()
        }
        this.onProxyAccountChange = this.onProxyAccountChange.bind(this);
        this.onAddWitnessItem = this.onAddWitnessItem.bind(this);
        this.onRemoveWitnessItem = this.onRemoveWitnessItem.bind(this);
    }

    onPublish() {
        if (!this.state.account) return

        let updated_account = this.state.account.toJS()
        updated_account.new_options = updated_account.options
        let new_proxy_id = this.getNewProxyID()
        updated_account.new_options.voting_account = new_proxy_id ? new_proxy_id : "1.2.0"

        let witness_votes = this.state.witnesses.map(item => {
            console.log("item:", item.toJS());
            return item.get('vote_id')
        })
        let committee_votes = this.state.committee.map(item => { return item.get('vote_id') })
        updated_account.new_options.num_committee = committee_votes.size
        updated_account.new_options.num_witness = witness_votes.size
        updated_account.new_options.votes = witness_votes.concat(committee_votes).toArray()
        updated_account.new_options.votes = updated_account.new_options.votes.sort((a, b)=> { return parseInt(a.split(':')[1]) - parseInt(b.split(':')[1]) })
        console.log("SORTED VOTES: ", updated_account.new_options.votes)

        updated_account.account = updated_account.id
        console.log("updated_account: ", updated_account)

        var tr = wallet_api.new_transaction();
        tr.add_type_operation("account_update", updated_account);
        WalletDb.process_transaction(tr, null, true)
    }

    onAddWitnessItem(item_id){
        this.setState({witnesses: this.state.witnesses.push(item_id)});
    }

    onRemoveWitnessItem(item_id){
        this.setState({witnesses: this.state.witnesses.filter(i => i !== item_id)});
    }

    onProxyAccountChange(proxy_account) {
        this.setState({proxy_account});
    }

    render() {
        console.log("-- AccountVoting.render -->", this.state.witnesses);
        let current_voting_account_id = this.props.account.get('options').get('voting_account');
        let proxy_is_set = !!this.state.proxy_account;

        let changed = false;
        let publish_buttons_class = "button" + (changed ? "" : " disabled");

        return (
            <div className="grid-content">
                <AccountVotingProxy
                    currentAccount={this.props.account}
                    proxyAccount={current_voting_account_id}
                    onProxyAccountChanged={this.onProxyAccountChange} />

                <div className={"content-block" + (proxy_is_set && false ? " disabled" : "")}>
                    <h3>Witnesses</h3>
                    <AccountVotingItems
                        label="account.votes.add_committee_label"
                        items={this.state.witnesses}
                        onAddItem={this.onAddWitnessItem}
                        onRemoveItem={this.onRemoveWitnessItem}/>
                </div>

                {/*<div className={"content-block" + (proxy_is_set ? " disabled" : "")}>
                    <h3>Committee</h3>
                    <AccountSelector label="account.votes.add_committee_label"
                                     error={this.state.current_add_committee_error}
                                     placeholder="New Committee Member"
                                     account={this.state.new_committee}
                                     onChange={this.onAddCommitteeChange.bind(this)}
                                     onAction={this.onAddCommittee.bind(this,this.state.new_committee)}
                                     action_class={add_committee_button_class}
                                     action_label="account.votes.add_committee"
                                     ref="add_committee_selector"
                                     tabIndex={proxy_is_set ? -1 : 3}/>
                    <table className="table">
                        <thead>
                        <tr>
                            <th style={{width: cw[0]}}></th>
                            <th style={{width: cw[1]}}><Translate content="account.votes.name"/></th>
                            <th style={{width: cw[2]}}><Translate content="account.votes.url"/></th>
                            <th style={{width: cw[3]}}>ACTION</th>
                        </tr>
                        </thead>
                        <tbody>
                        {committee_rows}
                        </tbody>
                    </table>
                </div>*/}

                <div className="content-block">
                    <button className={publish_buttons_class} onClick={this.onPublish.bind(this)}>
                        <Translate content="account.votes.publish"/></button>
                </div>
            </div>
        )
    }
}

export default AccountVoting;
