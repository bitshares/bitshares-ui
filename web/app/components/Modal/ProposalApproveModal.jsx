import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import AccountSelect from "components/Forms/AccountSelect";
import AccountStore from "stores/AccountStore";
import WalletDb from "stores/WalletDb";
import WalletApi from "rpc_api/WalletApi";
import Immutable from "immutable";
import NestedApprovalState from "../Account/NestedApprovalState";

let wallet_api = new WalletApi();

@BindToChainState()
class ProposalApproveModal extends React.Component {

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
        }
   }

   onActiveAccount(activeMap, type, account) {
        let newState = {};

        if (account) {
            newState[type] = activeMap[account];
        } else {
            newState[type] = null;
        }
        this.setState(newState);

   }

   _onProposalAction(oldProposal) {
        let proposalObject = oldProposal.toJS();
        let {active, key, owner, payee} = this.state;

        let proposal = {
            fee_paying_account: payee || active,
            proposal: proposalObject.id,
            active_approvals_to_add: [],
            active_approvals_to_remove: [],
            owner_approvals_to_add: [],
            owner_approvals_to_remove: [],
            key_approvals_to_add: [],
            key_approvals_to_remove: []
        };

        let isAdd = this.props.action === "approve";

        ["active", "owner", "key"].forEach(auth_type => {
            let value = this.state[auth_type];
            if (value) {
                let hasValue = proposalObject[`available_${auth_type}_approvals`].indexOf(value) !== -1;
                if ((isAdd && !hasValue) || (!isAdd && hasValue)) {
                    if (this.props.action === "approve") {
                        proposal[`${auth_type}_approvals_to_add`] = [value];
                    } else if (this.props.action === "reject") {
                        proposal[`${auth_type}_approvals_to_remove`] = [value];
                    }
                }

            }
        })

        console.log("final proposal:", proposal);

        var tr = wallet_api.new_transaction();
        tr.add_type_operation("proposal_update", proposal);
        WalletDb.process_transaction(tr, null, true);

        ZfApi.publish(this.props.modalId, "close");
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
        ZfApi.publish(this.props.modalId, "close");
    }

    render() {
        let {account, proposal, type} = this.props;

        let accountNames = [];
        let accountMap = {};
        let isAdd = this.props.action === "approve";

        if (this.props.accounts.length) {
            this.props.accounts.forEach(account => {
                let accountCheck = isAdd ? account && !proposal.get(`available_${type}_approvals`).includes(account.get("id")) :
                        account && proposal.get(`available_${type}_approvals`).includes(account.get("id"));
                if (accountCheck) {
                    accountMap[account.get("name")] = account.get("id");
                    accountNames.push(account.get("name"));
                }
            });
        }

        let keyNames = [];
        let keyMap = {};
      
        if (this.props.keys.size) {
            this.props.keys.forEach(key => {
                let isMine = AccountStore.isMyKey(key);
               
                if (isMine && !proposal.get("available_key_approvals").includes(key)) {
                    keyMap[key] = key;
                    keyNames.push(key);
                }
            });
        }

        let myAccounts = AccountStore.getMyAccounts();


        return (
            <form className="grid-block vertical full-width-content">
                <div className="grid-container">
                    <div className="content-block">
                        <h4>{isAdd ? "Add approval" : "Remove approval"}</h4>
                    </div>
                    <div className="content-block">
                        
                        <NestedApprovalState
                            proposal={proposal.get("id")}
                            type={type}
                            added={isAdd ? this.state[type] || null : null}
                            removed={!isAdd ? this.state[type] || null : null}
                        />
                    </div>
                    
                    <div className="content-block full-width-content">
                       <div className="full-width-content form-group">
                            <label>Pay with account</label>
                            <AccountSelect
                                account_names={myAccounts}
                                onChange={this.onChangePayee.bind(this)}
                            />
                        </div>

                        {accountNames.length ? (
                        <div className="full-width-content form-group">
                            <label>Account approval to {isAdd ? "add" : "remove"}</label>
                            <AccountSelect
                                account_names={accountNames}
                                onChange={this.onActiveAccount.bind(this, accountMap, type)}
                            />
                        </div>) : null}

                        {false && keyNames.length ? (
                        <div className="full-width-content form-group">
                            <label>Key approval to {isAdd ? "add" : "remove"}</label>
                            <AccountSelect
                                account_names={keyNames}
                                onChange={this.onActiveAccount.bind(this, keyMap, "key")}
                            />
                        </div>) : null}
                    </div>

                    <div className="content-block">
                        <input 
                            type="submit"
                            className="button" 
                            onClick={this._onProposalAction.bind(this, proposal)}
                            value={isAdd ? "Approve" : "Remove"} 
                        />
                        <div onClick={this.onCancel.bind(this)} className="secondary button">
                            <Translate content="account.perm.cancel" />
                        </div>
                    </div>
                </div> 
            </form>
        )
    }   
};

@BindToChainState()
class SecondLevel extends React.Component {
    static propTypes = {
       accounts: ChainTypes.ChainAccountsList
    };

    shouldComponentUpdate(nextProps) {

        return (
            !utils.are_equal_shallow(nextProps.accounts, this.props.accounts) ||
            !utils.are_equal_shallow(nextProps.keys, this.props.keys) ||
            !utils.are_equal_shallow(nextProps.addresses, this.props.addresses)
        );
    }

    getNestedAccountAuths(auths, type, auth_type, existing = Immutable.List()) {
        
        auths.forEach(auth => {
            if (auth) {
                if (auth_type === "account_auths" && !existing.includes(auth.get("id"))) {
                    existing = existing.push(auth.get("id"));
                }

                if (auth.getIn([type, auth_type]).size) {
                    existing = utils.flatten_auths(auth.getIn([type, auth_type]), existing);
                }
            }
        });

        return existing;
    }

    resolveAddresses(addresses, existing = Immutable.List()) {
        let myAccounts = AccountStore.getMyAccounts();
        console.log("myAccounts:", myAccounts);
        addresses.forEach(address => {
            console.log("address:", address);
        })

        return existing;
    }


    render() {
        let {type} = this.props;

        let nestedAccounts = this.getNestedAccountAuths(this.props.accounts, type, "account_auths");
        // let nestedAddresses = this.getNestedAccountAuths(this.props.accounts, type, "address_auths", this.props.addresses);
        let nestedKeys = this.getNestedAccountAuths(this.props.accounts, type, "key_auths", this.props.keys);

        return (
            <ProposalApproveModal
                action={this.props.action}
                modalId={this.props.modalId}
                account={this.props.account}
                proposal={this.props.proposal}
                accounts={nestedAccounts}
                keys={nestedKeys}                
                type={type}
                onClose={this.props.onClose}
            />
        );
    }
}

@BindToChainState()
class FirstLevel extends React.Component {
    static propTypes = {
       account: ChainTypes.ChainAccount.isRequired,
       proposal: ChainTypes.ChainObject.isRequired
   };

    render() {
        let {account} = this.props;

        let type = this.props.proposal.get("required_active_approvals").size ? "active" : "owner";

        let accounts = utils.flatten_auths(account.getIn([type, "account_auths"]));

        let keys = utils.flatten_auths(account.getIn([type, "key_auths"]));
        let addresses = utils.flatten_auths(account.getIn([type, "address_auths"]));

        return (
            <SecondLevel
                {...this.props}
                type={type}
                accounts={accounts}
                keys={keys}
                addresses={addresses}
            />
        );
    }
}

export default class ModalWrapper extends React.Component {

    show() {
        ZfApi.publish(this.props.modalId, "open");
    }

    render() {
        let {modalId, proposal} = this.props;

        return (
            <Modal id={modalId} overlay={true} ref={modalId}>
                <Trigger close={modalId}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical">
                    <FirstLevel
                        {...this.props}
                    />
                </div>
            </Modal>
            );
    }
}
