import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "../Utility/FormattedAsset";
import utils from "common/utils";
import classNames from "classnames";
import FormattedPrice from "../Utility/FormattedPrice";
import counterpart from "counterpart";
import AccountSelect from "components/Forms/AccountSelect";
import WalletDb from "stores/WalletDb";
import WalletApi from "rpc_api/WalletApi";
import Immutable from "immutable";
import NestedApprovalState from "../Account/NestedApprovalState";

let wallet_api = new WalletApi();

@BindToChainState()
class ProposalApproveModal extends React.Component {

   static propTypes = {
       account: ChainTypes.ChainAccount.isRequired,
       proposal: ChainTypes.ChainObject.isRequired,
       actives: ChainTypes.ChainAccountsList,
       owners: ChainTypes.ChainAccountsList       
   };

   constructor(props) {
        super();
        this.state = {
            active: null,
            owner: null,
            payee: props.account.get("id")
        }
   }

   onActiveAccount(activeMap, account) {

        if (account) {
            console.log(account, "id:", activeMap[account]);
            this.setState({
                active: activeMap[account]
            });
        }
   }

   _onProposalAction(type, oldProposal) {
        let proposalObject = oldProposal.toJS();
        let {active, owner, payee} = this.state;

        console.log("_onApprove:", payee, owner, active);

        let proposal = {
            fee_paying_account: payee,
            proposal: proposalObject.id,
            active_approvals_to_add: [],
            active_approvals_to_remove: [],
            owner_approvals_to_add: [],
            owner_approvals_to_remove: [],
            key_approvals_to_add: [],
            key_approvals_to_remove: []
        };

        if (proposalObject.available_active_approvals.indexOf(active) === -1) {
            if (type === "approve") {
                proposal.active_approvals_to_add = [active];
            } else if (type === "reject") {
                proposal.active_approvals_to_remove = [active];
            }
        }

        if (proposalObject.required_owner_approvals.indexOf(owner) !== -1 && proposalObject.available_owner_approvals.indexOf(owner) === -1) {
             if (type === "approve") {
                proposal.owner_approvals_to_add = [owner];
            } else if (type === "reject") {
                proposal.owner_approvals_to_remove = [owner];
            }
        }
        console.log("final proposal:", proposal);
        var tr = wallet_api.new_transaction();
        tr.add_type_operation("proposal_update", proposal);
        WalletDb.process_transaction(tr, null, true);

        ZfApi.publish(this.props.modalId, "close");
    }

    render() {
        let {account, proposal} = this.props;

        let activeNames = [];
        let activeMap = {};
        console.log("proposal:", proposal.toJS());
        this.props.actives.forEach(active => {
            if (active && !proposal.get("available_active_approvals").includes(active.get("id"))) {

                console.log("proposal includes:", proposal.get("available_active_approvals").includes(active.get("id")))
                activeMap[active.get("name")] = active.get("id");
                activeNames.push(active.get("name"));
            }
        });

        return (
            <form className="grid-block vertical full-width-content">
                <div className="grid-container">
                    <div className="content-block">
                        <h3>Add approval</h3>
                    </div>
                    <div className="content-block">
                        
                        <NestedApprovalState
                            proposal={proposal}
                            available={proposal.get("available_active_approvals")}
                            required={proposal.get("required_active_approvals")}
                            added={this.state.active || null}
                        />
                    </div>
                    <div className="content-block full-width-content">
                        <div className="full-width-content form-group">
                            <label>Active approval to add</label>
                            <AccountSelect
                                account_names={activeNames}
                                onChange={this.onActiveAccount.bind(this, activeMap)}
                            />
                        </div>
                    </div>

                    <div className="content-block">
                        <input 
                            type="submit"
                            className="button" 
                            onClick={this._onProposalAction.bind(this, "approve", proposal)}
                            value={"Approve"} 
                        />
                        <Trigger close={this.props.modal_id}>
                            <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                        </Trigger>
                    </div>
                </div> 
            </form>
        )
    }   
};

@BindToChainState()
class SecondLevel extends React.Component {
    static propTypes = {
       actives: ChainTypes.ChainAccountsList,
       owners: ChainTypes.ChainAccountsList
    };

    shouldComponentUpdate(nextProps) {

        return (
            !utils.are_equal_shallow(nextProps.actives, this.props.actives) ||
            !utils.are_equal_shallow(nextProps.owners, this.props.owners)
        );
    }

    render() {
        
        let owners = [];
        this.props.owners.forEach(owner => {
            if (owner && owner.getIn(["owner", "account_auths"]).size) {
                if (owners.indexOf(owner.get("id")) === -1) {
                    owners.push(owner.get("id"));
                }
            
                owner.getIn(["owner", "account_auths"]).forEach(account => {
                    if (owners.indexOf(account.get(0)) === -1) {
                        owners.push(account.get(0));
                    }
                });
            }
        });

        let actives = [];
        this.props.actives.forEach(active => {
            if (active && active.getIn(["active", "account_auths"]).size) {
                if (actives.indexOf(active.get("id")) === -1) {
                    actives.push(active.get("id"));
                }
                active.getIn(["active", "account_auths"]).forEach(account => {
                    if (actives.indexOf(account.get(0)) === -1) {
                        actives.push(account.get(0));
                    }
                });
            }
        });

        return (
            <ProposalApproveModal
                account={this.props.account}
                proposal={this.props.proposal}
                actives={Immutable.List(actives)}
                owners={Immutable.List(owners)}
            />
        );
    }
}

@BindToChainState()
class FirstLevel extends React.Component {
    static propTypes = {
       account: ChainTypes.ChainAccount.isRequired
   };

    render() {
        let {account} = this.props;

        let owners = account.getIn(["owner", "account_auths"]).map(owner => {
            return owner.get(0);  
        });

        let actives = account.getIn(["active", "account_auths"]).map(active => {
            return active.get(0);  
        });

        return (
            <SecondLevel
                {...this.props}
                actives={actives}
                owners={owners}
            />
        );
    }
}

export default class ModalWrapper extends React.Component {

    show() {
        let {modalId} = this.props;
        ZfApi.publish(modalId, "open");
    }

    render() {
        let {modalId} = this.props;

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
