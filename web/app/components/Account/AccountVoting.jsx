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
            new_witness_input: "", ///< the new delegate specified by the user
            new_witness_account: null, ///< the new delegate specified by the user
            new_committee: null, ///< the new witness specified by the user
            new_budget: null, ///< the new budget specified by the user
            changed: false,
            witnesses: new Immutable.Map(),
            committee: new Immutable.Map(),
            init_witnesses: new Immutable.Map(),
            init_committee: new Immutable.Map()
        }
        this.onProxyAccountChange = this.onProxyAccountChange.bind(this);
    }

    onProxyAccountChange(proxy_account) {
        //console.log("-- AccountVoting.onProxyAccountChange -->", !!proxy_account);
        this.setState({proxy_account});
    }



    onAddWitnessChange(new_witness) {
        console.log("-- AccountVoting.onAddWitnessChange -->", new_witness);
    }

    onAddCommitteeChange(new_committee) {
        console.log("-- AccountVoting.onAddCommitteeChange -->", new_committee);
    }

    onRemoveWitness(witness_to_remove) {
        console.log("Add Witness", this.state.new_witness)
        let next_state = {
            witnesses: this.state.witnesses.delete(witness_to_remove), changed: true
        }
    }

    onRemoveCommittee(member_to_remove) {
        console.log("Add Commitee", this.state.new_committee)
        let next_state = {
            committee: this.state.committee.delete(member_to_remove), changed: true
        }
    }

    onAddCommittee() {
        if (this.state.current_add_committee) {
            console.log("Add Committee", this.state.new_committee)
            let next_state = {
                new_committee: "",
                committee: this.state.committee.set(this.state.new_committee, this.state.current_add_committee)
            }
            next_state.committee = next_state.committee.sort()
        }
    }

    onAddWitness() {
        if (this.state.current_add_witness) {
            console.log("Add Witness", this.state.new_witness)
            let next_state = {
                new_witness: "",
                witnesses: this.state.witnesses.set(this.state.new_witness, this.state.current_add_witness)
            }
            next_state.witnesses = next_state.witnesses.sort()
        }
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

    render() {
        let current_voting_account_id = this.props.account.get('options').get('voting_account');
        let proxy_is_set = !!this.state.proxy_account;

        //let changed = new_id && !current_proxy_error
        //    && new_id != this.state.account.get('options').get('voting_account')

        let changed = this.state.init_witnesses != this.state.witnesses
        changed |= this.state.init_committee != this.state.committee

        let publish_buttons_class = "button" + (changed ? "" : " disabled");
        let add_witness_button_class = "button" + (this.state.current_add_witness ? "" : " disabled")
        let add_committee_button_class = "button" + (this.state.current_add_committee ? "" : " disabled")

        let witness_rows = this.state.witnesses.map(item => {
            let witness = item.toJS()
            let witness_account = ChainStore.getAccount(witness.witness_account)
            let url = witness.url
            let name = witness_account.get('name')
            return (
                <tr key={name}>
                    <td>
                        <AccountImage size={{height: 30, width: 30}} account={name} custom_image={null}/>
                    </td>
                    <td>{name}</td>
                    <td>{url}</td>
                    <td>
                        <button className="button outline" onClick={this.onRemoveWitness.bind(this, name)}>
                            <Translate content="account.votes.remove_witness"/></button>
                    </td>
                </tr>
            )
        })

        let committee_rows = this.state.committee.map(item => {
            let committee = item.toJS()
            let committee_account = ChainStore.getAccount(committee.committee_member_account)
            let url = committee.url
            let name = committee_account.get('name')
            return (
                <tr key={name}>
                    <td>
                        <AccountImage size={{height: 30, width: 30}} account={name} custom_image={null}/>
                    </td>
                    <td>{name}</td>
                    <td>{url}</td>
                    <td>
                        <button className="button outline" onClick={this.onRemoveCommittee.bind(this, name)}>
                            <Translate content="account.votes.remove_committee"/></button>
                    </td>
                </tr>
            )
        })


        let cw = ["10%", "20%", "60%", "10%"];
        return (
            <div className="grid-content">
                <AccountVotingProxy
                    currentAccount={this.props.account}
                    proxyAccount={current_voting_account_id}
                    onProxyAccountChanged={this.onProxyAccountChange} />

                <div className={"content-block" + (proxy_is_set && false ? " disabled" : "")}>
                    <h3>Witnesses</h3>
                    <AccountVotingItems
                        items={{"1.2.10":"1.2.10", "1.2.17":"1.2.17", "1.2.1":"1.2.1", "1.2.3":"1.2.3"}}/>
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
