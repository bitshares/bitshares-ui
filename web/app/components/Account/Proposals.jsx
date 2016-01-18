import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import ProposedOperation from "components/Blockchain/ProposedOperation"
import BindToChainState from "components/Utility/BindToChainState"
import ChainTypes from "components/Utility/ChainTypes"
import utils from "common/utils"
import WalletDb from "stores/WalletDb";
import WalletApi from "rpc_api/WalletApi";
let wallet_api = new WalletApi()

@BindToChainState({keep_updating: true})
export default class Proposals extends Component {

    static propTypes = {
        accountList: ChainTypes.ChainAccountsList.isRequired,
    }

    shouldComponentUpdate(nextProps, nextState) {
        // console.log("should render")
        var len1 = this.props.accountList.length
        var len2 = nextProps.accountList.length
        if( len1 !== len2 ) return true
        for(let i = 0; i < len1; i++) {
            var a1 = this.props.accountList[i]
            var a2 = nextProps.accountList[i]
            if( a1 !== a2 ) return true
            if( ! a1 ) continue // undefined or null
            if( a1.get("proposals") !== a2.get("proposals") ) return true
        }
        return false
    }

    _onProposalAction(type, oldProposal) {
        let proposalObject = oldProposal.proposal.toJS();
        let id = oldProposal.account.get("id");
        console.log("_onApprove:", proposalObject, id);

        let proposal = {
            fee_paying_account: id,
            proposal: proposalObject.id,
            active_approvals_to_add: [],
            active_approvals_to_remove: [],
            owner_approvals_to_add: [],
            owner_approvals_to_remove: [],
            key_approvals_to_add: [],
            key_approvals_to_remove: []
        };

        if (proposalObject.required_active_approvals.indexOf(id) !== -1 && proposalObject.available_active_approvals.indexOf(id) === -1) {
            if (type === "approve") {
                proposal.active_approvals_to_add = [id];
            } else if (type === "reject") {
                proposal.active_approvals_to_remove = [id];
            }
        }

        if (proposalObject.required_owner_approvals.indexOf(id) !== -1 && proposalObject.available_owner_approvals.indexOf(id) === -1) {
             if (type === "approve") {
                proposal.owner_approvals_to_add = [id];
            } else if (type === "reject") {
                proposal.owner_approvals_to_remove = [id];
            }
        }

        var tr = wallet_api.new_transaction();
        tr.add_type_operation("proposal_update", proposal);
        WalletDb.process_transaction(tr, null, true);
    }

    render() {

        let proposals = [];
        for(let account of this.props.accountList) {
            if( ! account ) continue
            if( ! account.get("proposals").size ) continue
            account.get("proposals").forEach( proposal_id => {
                var proposal = ChainStore.getObject( proposal_id )
                if( proposal ) {
                    console.log("proposal:", proposal.toJS());
                    var proposed_transaction = proposal.get("proposed_transaction")
                    var operations = proposed_transaction.get("operations")
                    proposals.push({operations: operations, proposal: proposal, account: account});
                }
            })
        }

        let proposalRows = proposals.map(proposal => {

            let text = proposal.operations.map( (o, index) => {
                return <ProposedOperation
                        index={index}
                        op={o.toJS()}
                        inverted={false}
                        hideFee={false}
                        hideOpLabel={true}
                        hideDate={true}
                        proposal={true}
                        proposalObject={proposal.proposal}
                        account={proposal.account.toJS()}
                    />
                }).toArray();

            console.log("text:", text);

            text.push(text[0]);


            return (
                <tr key={proposal.proposal.get("id")}>
                    <td>#{proposal.proposal.get("id")}</td>
                    <td>
                        {text}
                    </td>
                    <td>
                        <button onClick={this._onProposalAction.bind(this, "approve", proposal)} className="button success">Approve</button>
                    </td>
                    <td>
                        <button onClick={this._onProposalAction.bind(this, "reject", proposal)} className="button">Reject</button>
                    </td>
                </tr>
            );
        })

        return (
            <table className={"table compact"}>
                <thead>
                <tr>
                    <th></th>
                    <th><Translate content="account.votes.info" /></th>
                    <th colSpan="2"><Translate content="proposal.action" /></th>
                </tr>
                </thead>
                <tbody>
                    { proposalRows }
                </tbody>
            </table>
        );
    }
}
