import React from "react";
import {Component} from "react";
import Translate from "react-translate-component";
import ProposedOperation, {
    TransactionIDAndExpiry
} from "components/Blockchain/ProposedOperation";
import BindToChainState from "components/Utility/BindToChainState";
import ChainTypes from "components/Utility/ChainTypes";
import utils from "common/utils";
import ProposalApproveModal, {
    finalRequiredPerms
} from "../Modal/ProposalApproveModal";
import NestedApprovalState from "../Account/NestedApprovalState";
import {ChainStore} from "bitsharesjs/es";
import counterpart from "counterpart";
import pu from "common/permission_utils";
import LinkToAccountById from "../Utility/LinkToAccountById";
import AccountStore from "stores/AccountStore";

class Proposals extends Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    constructor() {
        super();

        this.forceUpdate = this.forceUpdate.bind(this);
    }

    componentDidMount() {
        /*
        * Account objects don't get updated by underlying proposal changes, but
        * the ChainStore does, so in order to update this component when a proposal
        * changes, we need to update it whenever the ChainStore itself updates
        */
        ChainStore.subscribe(this.forceUpdate);
    }

    componentWillUnmount() {
        ChainStore.unsubscribe(this.forceUpdate);
    }

    _onApproveModal(id, action) {
        if (this.refs[id + "_" + action]) {
            this.refs[id + "_" + action].show();
        }
    }

    _canReject(proposal) {
        return (
            proposal.available_active_approvals.length ||
            proposal.available_owner_approvals.length ||
            proposal.available_key_approvals.length
        );
    }

    render() {
        let {account} = this.props;
        if (!account) return null;

        let proposals = [];

        if (account.get("proposals").size) {
            account.get("proposals").forEach(proposal_id => {
                var proposal = ChainStore.getObject(proposal_id);
                if (proposal) {
                    var proposed_transaction = proposal.get(
                        "proposed_transaction"
                    );
                    var operations = proposed_transaction.get("operations");
                    proposals.push({operations, account, proposal});
                }
            });
        }

        let proposalRows = proposals
            .sort((a, b) => {
                return utils.sortID(
                    a.proposal.get("id"),
                    b.proposal.get("id"),
                    true
                );
            })
            .reduce((result, proposal, index) => {
                let isScam = false;
                const id = proposal.proposal.get("id");
                const expiration = proposal.proposal.get("expiration_time");
                let text = proposal.operations
                    .map((o, index) => {
                        if (o.getIn([1, "to"]) === "1.2.153124") isScam = true;
                        return (
                            <ProposedOperation
                                key={
                                    proposal.proposal.get("id") +
                                    "_operation_" +
                                    index
                                }
                                expiration={expiration}
                                index={index}
                                op={o.toJS()}
                                inverted={false}
                                hideFee={true}
                                hideOpLabel={true}
                                hideExpiration
                                hideDate={true}
                                proposal={true}
                                id={id}
                            />
                        );
                    })
                    .toArray();

                let canReject = this._canReject(proposal.proposal.toJS());
                let proposalId = proposal.proposal.get("id");

                let type = proposal.proposal.get("required_active_approvals")
                    .size
                    ? "active"
                    : "owner";
                result.push(
                    <tr key={`${proposalId}_id`}>
                        <td
                            colSpan="4"
                            className={
                                "proposal" + (index === 0 ? " first" : "")
                            }
                        >
                            <TransactionIDAndExpiry
                                id={id}
                                expiration={expiration}
                            />
                        </td>
                    </tr>
                );

                const available = pu.listToIDs(
                    proposal.proposal.get(`available_${type}_approvals`)
                );
                const availableKeys = pu.listToIDs(
                    proposal.proposal.get("available_key_approvals")
                );

                const required = pu.listToIDs(
                    proposal.proposal.get(`required_${type}_approvals`)
                );
                const requiredPermissions = pu.unnest(required, type);

                const [accounts, keys] = finalRequiredPerms(
                    requiredPermissions,
                    available,
                    availableKeys
                );

                const accountNames = [];

                if (accounts.length) {
                    accounts.forEach(account => {
                        if (
                            account &&
                            !proposal.proposal
                                .get(`available_${type}_approvals`)
                                .includes(account)
                        ) {
                            accountNames.push(account);
                        }
                    });
                }

                const keyNames = [];
                if (keys.length) {
                    keys.forEach(key => {
                        let isMine = AccountStore.isMyKey(key);
                        if (
                            isMine &&
                            !proposal.proposal
                                .get("available_key_approvals")
                                .includes(key)
                        ) {
                            keyNames.push(key);
                        }
                    });
                }

                const canApprove = accountNames.length + keyNames.length > 0;

                result.push(
                    <tr
                        className="top-left-align"
                        key={`${proposalId}_content`}
                    >
                        <td>{text}</td>
                        <td>
                            {requiredPermissions.map((account, index) => (
                                <div
                                    className="list-item"
                                    key={`${proposalId}_approver_${index}`}
                                >
                                    <LinkToAccountById
                                        subpage="permissions"
                                        account={account.id}
                                    />
                                </div>
                            ))}
                        </td>
                        <td>
                            <NestedApprovalState
                                proposal={proposal.proposal.get("id")}
                                type={type}
                            />
                        </td>
                        <td className="approval-buttons">
                            {isScam ? (
                                <div
                                    data-tip={counterpart.translate(
                                        "tooltip.propose_scam"
                                    )}
                                    className="tooltip has-error scam-error"
                                >
                                    SCAM
                                </div>
                            ) : (
                                <button
                                    onClick={
                                        canApprove
                                            ? this._onApproveModal.bind(
                                                  this,
                                                  proposalId,
                                                  "approve"
                                              )
                                            : () => {}
                                    }
                                    className={
                                        "button primary hollow" +
                                        (canApprove ? "" : " hidden")
                                    }
                                >
                                    <span>
                                        <Translate content="proposal.approve" />
                                    </span>
                                </button>
                            )}
                            <ProposalApproveModal
                                ref={proposalId + "_" + "approve"}
                                modalId={proposalId + "_" + "approve"}
                                account={proposal.account.get("id")}
                                proposal={proposalId}
                                action="approve"
                            />
                            {canReject ? (
                                <button
                                    onClick={this._onApproveModal.bind(
                                        this,
                                        proposalId,
                                        "reject"
                                    )}
                                    className="button primary hollow"
                                >
                                    <Translate content="proposal.reject" />
                                </button>
                            ) : null}
                            <ProposalApproveModal
                                ref={proposalId + "_" + "reject"}
                                modalId={proposalId + "_" + "reject"}
                                account={proposal.account.get("id")}
                                proposal={proposalId}
                                action="reject"
                            />
                        </td>
                    </tr>
                );
                result.push(
                    <tr key={`${proposalId}_separator`}>
                        <td colSpan="4">
                            <hr />
                        </td>
                    </tr>
                );
                return result;
            }, []);

        return (
            <table
                className={"table proposals compact " + this.props.className}
            >
                <thead>
                    <tr>
                        <th>
                            <Translate content="proposal.proposals" />
                        </th>
                        <th>
                            <Translate content="proposal.approvers" />
                        </th>
                        <th>
                            <Translate content="proposal.status" />
                        </th>
                        <th>
                            <Translate content="proposal.action" />
                        </th>
                    </tr>
                </thead>
                <tbody>{proposalRows}</tbody>
            </table>
        );
    }
}

export default BindToChainState(Proposals);
