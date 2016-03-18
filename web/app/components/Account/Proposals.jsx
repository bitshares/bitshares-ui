import React from "react";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import ProposedOperation from "components/Blockchain/ProposedOperation"
import BindToChainState from "components/Utility/BindToChainState"
import ChainTypes from "components/Utility/ChainTypes"
import utils from "common/utils"
import ProposalApproveModal from "../Modal/ProposalApproveModal";
import NestedApprovalState from "../Account/NestedApprovalState";

@BindToChainState({keep_updating: true})
export default class Proposals extends Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    // shouldComponentUpdate(nextProps, nextState) {
    //     // console.log("should render")
    //     var len1 = this.props.accountList.length
    //     var len2 = nextProps.accountList.length
    //     if( len1 !== len2 ) return true
    //     for(let i = 0; i < len1; i++) {
    //         var a1 = this.props.accountList[i]
    //         var a2 = nextProps.accountList[i]
    //         if( a1 !== a2 ) return true
    //         if( ! a1 ) continue // undefined or null
    //         if( a1.get("proposals") !== a2.get("proposals") ) return true
    //     }
    //     return false
    // }

    _onApproveModal(id) {
        if (this.refs[id]) {
            this.refs[id].show();
        }
    }

    _canApprove(proposal, id) {

        if (proposal.required_active_approvals.indexOf(id) !== -1 && proposal.available_active_approvals.indexOf(id) === -1) {
            return true;
        } else if (proposal.required_owner_approvals.indexOf(id) !== -1 && proposal.available_owner_approvals.indexOf(id) === -1) {
            return true;
        } else {
            return false;
        }
    }

    _canReject(proposal, id) {
        console.log(proposal, id);
        if (proposal.available_active_approvals.indexOf(id) !== -1) {
            return true;
        } else if (proposal.available_owner_approvals.indexOf(id) !== -1) {
            return true;
        } else {
            return false;
        }
    }

    render() {
        let {account} = this.props;
        if( ! account ) return null;

        let proposals = [];
            
        if( account.get("proposals").size ) {
            console.log("account:", account.toJS());
            account.get("proposals").forEach( proposal_id => {
                var proposal = ChainStore.getObject( proposal_id )
                if( proposal ) {
                    var proposed_transaction = proposal.get("proposed_transaction")
                    var operations = proposed_transaction.get("operations")
                    proposals.push({operations, account, proposal});
                }
            })
        }

        let proposalRows = proposals
            .sort((a, b) => {
                return utils.sortID(a.proposal.get("id"), b.proposal.get("id"), true);
            })
            .map(proposal => {

            let text = proposal.operations.map( (o, index) => {
                return <ProposedOperation
                        key={proposal.proposal.get("id") + "_" + index}
                        expiration={proposal.proposal.get("expiration_time")}
                        index={index}
                        op={o.toJS()}
                        inverted={false}
                        hideFee={false}
                        hideOpLabel={true}
                        hideDate={true}
                        proposal={true}
                    />
                }).toArray();

            let canApprove = this._canApprove(proposal.proposal.toJS(), proposal.account.get("id"));
            let canReject = this._canReject(proposal.proposal.toJS(), proposal.account.get("id"));

            let proposalId = proposal.proposal.get("id");

            console.log("full proposal:", proposal);
            return (
                <tr key={proposalId}>
                    <td>#{proposalId}</td>
                    <td>
                        {text}
                    </td>
                    <td>
                        <NestedApprovalState
                            proposal={proposal.proposal}
                            available={proposal.proposal.get("available_active_approvals")}
                            required={proposal.proposal.get("required_active_approvals")}
                        />
                    </td>
                    {canApprove ? (
                            <td>
                                <button
                                    onClick={this._onApproveModal.bind(this, proposalId)}
                                    className="button success"
                                >
                                    <span>Approve</span>
                                </button>
                                <ProposalApproveModal
                                    ref={proposalId}
                                    modalId={proposalId}
                                    account={proposal.account.get("id")}
                                    proposal={proposalId}

                                />
                            </td>) : null}
                    {canReject ? (
                            <td>
                            <button onClick={this._onProposalAction.bind(this, "reject", proposal)} className="button">Reject</button>

                        </td>) : null}
                </tr>
            );
        })

        return (
            <table className={"table compact"}>
                <thead>
                <tr>
                    <th></th>
                    <th><Translate content="account.votes.info" /></th>
                    <th>Status</th>
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
