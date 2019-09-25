import React from "react";
import {Component} from "react";
import Translate from "react-translate-component";
import ProposedOperation, {
    TransactionIDAndExpiry
} from "components/Blockchain/ProposedOperation";
import BindToChainState from "components/Utility/BindToChainState";
import ChainTypes from "components/Utility/ChainTypes";
import utils from "common/utils";
import ProposalModal, {finalRequiredPerms} from "../Modal/ProposalModal";
import NestedApprovalState from "../Account/NestedApprovalState";
import {ChainStore, FetchChainObjects} from "tuscjs";
import counterpart from "counterpart";
import permission_utils from "common/permission_utils";
import LinkToAccountById from "../Utility/LinkToAccountById";
import AccountStore from "stores/AccountStore";
import accountUtils from "common/account_utils";
import {Tooltip} from "bitshares-ui-style-guide";

class Proposals extends Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    constructor() {
        super();

        this.state = {
            isModalVisible: false,
            modal: {
                action: null,
                proposalId: null,
                accountId: null
            }
        };

        this._proposals = [];
        this._loading = false;

        this.forceUpdate = this.forceUpdate.bind(this);
        this._isScam = this._isScam.bind(this);
        this._isUnknown = this._isUnknown.bind(this);
        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    componentDidMount() {
        /*
         * Account objects don't get updated by underlying proposal changes, but
         * the ChainStore does, so in order to update this component when a proposal
         * changes, we need to update it whenever the ChainStore itself updates
         */
        ChainStore.subscribe(this.forceUpdate);
    }

    _setProposals() {
        this._loading = true;
        // resolve proposals
        let account = this.props.account;
        if (account.get("proposals").size) {
            let proposals = [];
            account.get("proposals").forEach(proposal_id => {
                let proposal = ChainStore.getObject(proposal_id);
                if (proposal) {
                    let proposed_transaction = proposal.get(
                        "proposed_transaction"
                    );
                    let operations = proposed_transaction.get("operations");
                    proposals.push({operations, account, proposal});
                }
            });
            proposals = proposals.sort((a, b) => {
                return utils.sortID(
                    a.proposal.get("id"),
                    b.proposal.get("id"),
                    true
                );
            });
            proposals.forEach(proposal => {
                let type = proposal.proposal.get("required_active_approvals")
                    .size
                    ? "active"
                    : "owner";
                const required = permission_utils.listToIDs(
                    proposal.proposal.get(`required_${type}_approvals`)
                );
                proposal.requiredPermissions = permission_utils.unnest(
                    required,
                    type
                );
            });
            this._proposals = proposals;
            this._loading = false;
        }
    }

    componentWillUnmount() {
        ChainStore.unsubscribe(this.forceUpdate);
    }

    showModal({action, proposalId, accountId}) {
        this.setState({
            isModalVisible: true,
            modal: {
                action,
                proposalId,
                accountId
            }
        });
    }

    hideModal() {
        this.setState({
            isModalVisible: false,
            modal: {
                action: null,
                proposalId: null,
                accountId: null
            }
        });
    }

    _onApproveModal(proposalId, accountId, action) {
        this.showModal({action, proposalId, accountId});
    }

    _canReject(proposal) {
        return (
            proposal.available_active_approvals.length ||
            proposal.available_owner_approvals.length ||
            proposal.available_key_approvals.length
        );
    }

    _isScam(proposal) {
        let isScam = false;

        let touchedAccounts = [];
        proposal.operations.forEach(o => {
            if (o.get(0) == 6) {
                touchedAccounts.push(
                    o.getIn([1, "active", "account_auths", 0, 0])
                );
                touchedAccounts.push(
                    o.getIn([1, "owner", "account_auths", 0, 0])
                );
            } else {
                touchedAccounts.push(o.getIn([1, "to"]));
            }
        });

        let proposer = proposal.proposal.get("proposer");

        touchedAccounts.push(proposer);

        /* if (__DEV__) {
            console.log(
                "Proposed transactions: ",
                proposal,
                " touching accounts ",
                touchedAccounts
            );
        } */

        touchedAccounts.forEach(_account => {
            if (accountUtils.isKnownScammer(_account)) {
                isScam = true;
            }
            if (
                this.props.account.get("blacklisted_accounts").some(item => {
                    return item === _account;
                })
            ) {
                isScam = true;
            }
        });
        return isScam;
    }

    _isUnknown(proposal) {
        let isUnknown = true;

        let touchedAccounts = [];
        proposal.operations.forEach(o => {
            if (o.get(0) == 6) {
                touchedAccounts.push(
                    o.getIn([1, "active", "account_auths", 0, 0])
                );
                touchedAccounts.push(
                    o.getIn([1, "owner", "account_auths", 0, 0])
                );
            } else {
                touchedAccounts.push(o.getIn([1, "to"]));
            }
        });

        let proposer = proposal.proposal.get("proposer");

        touchedAccounts.push(proposer);
        touchedAccounts.forEach(_account => {
            if (
                this.props.account.get("whitelisted_accounts").some(item => {
                    return item === _account;
                })
            ) {
                isUnknown = false;
            }
            let starred = AccountStore.getState().starredAccounts;
            if (
                starred.some(item => {
                    let name = ChainStore.getAccount(item, false);
                    if (!!name) {
                        return name.get("id") == _account;
                    } else {
                        return false;
                    }
                })
            ) {
                isUnknown = false;
            }
            let contacts = AccountStore.getState().accountContacts;
            if (
                contacts.some(item => {
                    let name = ChainStore.getAccount(item, false);
                    if (!!name) {
                        return name.get("id") == _account;
                    }
                    return false;
                })
            ) {
                isUnknown = false;
            }
        });
        return isUnknown;
    }

    render() {
        let {account} = this.props;
        if (!account) return null;

        if (
            (account.get("proposals").size > 0 &&
                this._proposals.length == 0) ||
            (this._proposals.length > 0 &&
                account !== this._proposals[0].account &&
                !this._loading)
        ) {
            this._setProposals();
        }

        let proposalRows = this._proposals.reduce((result, proposal, index) => {
            const id = proposal.proposal.get("id");
            const proposer = proposal.proposal.get("proposer");
            const expiration = proposal.proposal.get("expiration_time");
            let text = proposal.operations
                .map((o, index) => {
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
                            proposer={proposer}
                            collapsed={false}
                        />
                    );
                })
                .toArray();

            let canReject = this._canReject(proposal.proposal.toJS());
            let proposalId = proposal.proposal.get("id");

            let type = proposal.proposal.get("required_active_approvals").size
                ? "active"
                : "owner";
            result.push(
                <tr key={`${proposalId}_id`}>
                    <td
                        colSpan="4"
                        className={"proposal" + (index === 0 ? " first" : "")}
                    >
                        <TransactionIDAndExpiry
                            id={id}
                            expiration={expiration}
                        />
                    </td>
                </tr>
            );

            const available = permission_utils.listToIDs(
                proposal.proposal.get(`available_${type}_approvals`)
            );
            const availableKeys = permission_utils.listToIDs(
                proposal.proposal.get("available_key_approvals")
            );

            let requiredPermissions = proposal.requiredPermissions;

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

            let isScam = this._isScam(proposal);
            let isUnknown = this._isUnknown(proposal);

            result.push(
                <tr className="top-left-align" key={`${proposalId}_content`}>
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
                        {isScam && (
                            <Tooltip
                                title={counterpart.translate(
                                    "tooltip.propose_scam"
                                )}
                            >
                                <div className="tooltip has-error scam-error">
                                    SCAM ATTEMPT
                                </div>
                            </Tooltip>
                        )}
                        {this.props.hideFishingProposals &&
                            !isScam &&
                            isUnknown && (
                                <Tooltip
                                    title={counterpart.translate(
                                        "tooltip.propose_unknown"
                                    )}
                                >
                                    <div className="tooltip has-error scam-error">
                                        UNKNOWN SOURCE
                                    </div>
                                </Tooltip>
                            )}
                        {!isScam &&
                            (!isUnknown ||
                                !this.props.hideFishingProposals) && (
                                <button
                                    onClick={
                                        canApprove
                                            ? this._onApproveModal.bind(
                                                  this,
                                                  proposalId,
                                                  proposal.account.get("id"),
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
                        {canReject ? (
                            <button
                                onClick={this._onApproveModal.bind(
                                    this,
                                    proposalId,
                                    proposal.account.get("id"),
                                    "reject"
                                )}
                                className="button primary hollow"
                            >
                                <Translate content="proposal.reject" />
                            </button>
                        ) : null}
                        <button
                            onClick={this._onApproveModal.bind(
                                this,
                                proposalId,
                                proposal.account.get("id"),
                                "delete"
                            )}
                            className="button primary hollow"
                        >
                            <Translate content="proposal.delete" />
                        </button>
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
            <div>
                <table
                    className={
                        "table proposals compact " + this.props.className
                    }
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
                <ProposalModal
                    ref={"modal"}
                    visible={this.state.isModalVisible}
                    hideModal={this.hideModal}
                    showModal={this.showModal}
                    account={this.state && this.state.modal.accountId}
                    proposal={this.state && this.state.modal.proposalId}
                    action={this.state && this.state.modal.action}
                />
            </div>
        );
    }
}

export default BindToChainState(Proposals);
