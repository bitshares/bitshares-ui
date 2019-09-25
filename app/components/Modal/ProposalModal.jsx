import React from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AccountSelect from "components/Forms/AccountSelect";
import AccountStore from "stores/AccountStore";
import WalletDb from "stores/WalletDb";
import WalletApi from "api/WalletApi";
import NestedApprovalState from "../Account/NestedApprovalState";
import pu from "common/permission_utils";
import {ChainStore} from "tuscjs";
import {Modal, Button} from "bitshares-ui-style-guide";

export const finalRequiredPerms = (
    requiredPermissions,
    available,
    availableKeys
) => {
    let finalRequired = [];

    requiredPermissions.forEach(account => {
        finalRequired = finalRequired.concat(account.getMissingSigs(available));
    });

    let finalRequiredKeys = [];

    requiredPermissions.forEach(account => {
        finalRequiredKeys = finalRequiredKeys.concat(
            account.getMissingKeys(availableKeys)
        );
    });

    return [finalRequired, finalRequiredKeys];
};

class ProposalModal extends React.Component {
    static propTypes = {
        accounts: ChainTypes.ChainAccountsList
    };

    constructor(props) {
        super();
        this.state = {
            active: null,
            key: null,
            owner: null,
            payee: null
        };
    }

    onActiveAccount(accountMap, keyMap, type, account) {
        let newState = {};

        if (keyMap[account]) {
            newState["key"] = account;
            newState[type] = null;
        } else if (account) {
            newState[type] = accountMap[account];
            newState["key"] = null;
        } else {
            newState[type] = null;
            newState["key"] = null;
        }
        this.setState(newState);
    }

    _onProposalAction(oldProposal) {
        let proposalObject = oldProposal.toJS();
        let {active, key, owner, payee} = this.state;
        const fee_paying_account = payee || active;

        if (this.props.action === "delete") {
            const transaction = WalletApi.new_transaction();
            transaction.add_type_operation("proposal_delete", {
                fee_paying_account:
                    fee_paying_account || this.props.account.get("id"),
                proposal: proposalObject.id,
                using_owner_authority: false
            });
            WalletDb.process_transaction(transaction, null, true);
        } else {
            let proposal = {
                fee_paying_account,
                proposal: proposalObject.id,
                active_approvals_to_add: [],
                active_approvals_to_remove: [],
                owner_approvals_to_add: [],
                owner_approvals_to_remove: [],
                key_approvals_to_add: [],
                key_approvals_to_remove: []
            };

            let isAdd = this.props.action === "approve";

            let neededKeys = [];

            ["active", "owner", "key"].forEach(auth_type => {
                let value = this.state[auth_type];
                if (value) {
                    let hasValue =
                        proposalObject[
                            `available_${auth_type}_approvals`
                        ].indexOf(value) !== -1;
                    if ((isAdd && !hasValue) || (!isAdd && hasValue)) {
                        if (this.props.action === "approve") {
                            proposal[`${auth_type}_approvals_to_add`] = [value];
                            if (auth_type === "key") neededKeys.push(value);
                        } else if (this.props.action === "reject") {
                            proposal[`${auth_type}_approvals_to_remove`] = [
                                value
                            ];
                            if (auth_type === "key") neededKeys.push(value);
                        }
                    }
                }
            });

            var tr = WalletApi.new_transaction();
            tr.add_type_operation("proposal_update", proposal);
            WalletDb.process_transaction(tr, null, true, neededKeys);
        }

        this.props.hideModal();
    }

    onChangePayee(account) {
        let fullAccount = ChainStore.getAccount(account);

        if (fullAccount) {
            this.setState({
                payee: fullAccount.get("id")
            });
        }
    }

    onCancel() {
        this.props.hideModal();
    }

    render() {
        let {proposal, type} = this.props;

        let accountNames = [];
        let accountMap = {};
        let isAdd = this.props.action === "approve";

        if (this.props.accounts.length) {
            this.props.accounts.forEach(account => {
                let accountCheck = isAdd
                    ? account &&
                      !proposal
                          .get(`available_${type}_approvals`)
                          .includes(account.get("id"))
                    : account &&
                      proposal
                          .get(`available_${type}_approvals`)
                          .includes(account.get("id"));
                if (accountCheck) {
                    accountMap[account.get("name")] = account.get("id");
                    accountNames.push(account.get("name"));
                }
            });
        }

        let keyNames = [];
        let keyMap = {};
        if (this.props.keys.length) {
            this.props.keys.forEach(key => {
                let isMine = AccountStore.isMyKey(key);
                let hasValue = proposal
                    .get("available_key_approvals")
                    .includes(key);
                if (
                    (isMine && isAdd && !hasValue) ||
                    (isMine && !isAdd && hasValue)
                ) {
                    keyMap[key] = true;
                    keyNames.push(key);
                }
            });
        }

        let myAccounts = AccountStore.getMyAccounts();

        let footer = [
            <Button
                key="submit"
                type="primary"
                onClick={this._onProposalAction.bind(this, proposal)}
            >
                {counterpart.translate(`proposal.${this.props.action}`)}
            </Button>,
            <Button key="cancel" onClick={this.onCancel.bind(this)}>
                {counterpart.translate("account.perm.cancel")}
            </Button>
        ];

        return (
            <Modal
                visible={this.props.visible}
                title={counterpart.translate(
                    `modal.proposals.actions.${this.props.action}`
                )}
                footer={footer}
                onCancel={this.props.hideModal}
            >
                <div className="grid-block vertical">
                    <form
                        className="grid-block vertical full-width-content"
                        style={{paddingTop: 0}}
                    >
                        <div className="grid-container">
                            <div
                                className="content-block"
                                style={{paddingRight: "20%"}}
                            >
                                <NestedApprovalState
                                    expanded
                                    proposal={proposal.get("id")}
                                    type={type}
                                    added={
                                        isAdd
                                            ? this.state.key
                                                ? this.state.key
                                                : this.state[type] || null
                                            : null
                                    }
                                    removed={
                                        !isAdd
                                            ? this.state.key
                                                ? this.state.key
                                                : this.state[type] || null
                                            : null
                                    }
                                    noFail
                                />
                            </div>

                            <div className="content-block full-width-content">
                                <div className="full-width-content form-group">
                                    <Translate
                                        content="modal.proposals.pay_with"
                                        component="label"
                                    />
                                    <AccountSelect
                                        account_names={myAccounts}
                                        onChange={this.onChangePayee.bind(this)}
                                        selected={
                                            myAccounts.length === 1
                                                ? myAccounts
                                                : null
                                        }
                                    />
                                </div>

                                {this.props.action !== "delete" &&
                                (accountNames.length || keyNames.length) ? (
                                    <div className="full-width-content form-group">
                                        <Translate
                                            content={`modal.proposals.approval_${
                                                isAdd ? "add" : "remove"
                                            }`}
                                            component="label"
                                        />
                                        <AccountSelect
                                            account_names={accountNames.concat(
                                                keyNames
                                            )}
                                            onChange={this.onActiveAccount.bind(
                                                this,
                                                accountMap,
                                                keyMap,
                                                type
                                            )}
                                        />
                                    </div>
                                ) : null}

                                {false && keyNames.length ? (
                                    <div className="full-width-content form-group">
                                        <Translate
                                            content={`modal.proposals.key_approval_${
                                                isAdd ? "add" : "remove"
                                            }`}
                                            component="label"
                                        />
                                        <AccountSelect
                                            account_names={keyNames}
                                            onChange={this.onActiveAccount.bind(
                                                this,
                                                keyMap,
                                                "key"
                                            )}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </form>
                </div>
            </Modal>
        );
    }
}
ProposalModal = BindToChainState(ProposalModal);

class FirstLevel extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        proposal: ChainTypes.ChainObject.isRequired
    };

    constructor() {
        super();

        this._updateState = this._updateState.bind(this);
    }

    componentWillMount() {
        this._updateState();

        ChainStore.subscribe(this._updateState);
    }

    componentWillUnmount() {
        ChainStore.unsubscribe(this._updateState);
    }

    _updateState() {
        let {proposal, account} = this.props;
        let type = proposal.get("required_active_approvals").size
            ? "active"
            : "owner";

        let required = pu.listToIDs(proposal.get(`required_${type}_approvals`));
        let available = pu.listToIDs(
            proposal.get(`available_${type}_approvals`)
        );
        let availableKeys = pu.listToIDs(
            proposal.get("available_key_approvals")
        );

        this.setState({
            requiredPermissions: pu.unnest(required, type),
            available,
            availableKeys,
            type
        });
    }

    render() {
        let {action} = this.props;
        let {requiredPermissions, available, availableKeys, type} = this.state;

        const [finalRequired, finalRequiredKeys] = finalRequiredPerms(
            requiredPermissions,
            available,
            availableKeys
        );

        return (
            <ProposalModal
                {...this.props}
                type={type}
                accounts={action === "approve" ? finalRequired : available}
                keys={action === "approve" ? finalRequiredKeys : availableKeys}
            />
        );
    }
}
FirstLevel = BindToChainState(FirstLevel);

export default class ModalWrapper extends React.Component {
    render() {
        if (!this.props.account || !this.props.proposal || !this.props.action)
            return null;

        return <FirstLevel {...this.props} />;
    }
}
