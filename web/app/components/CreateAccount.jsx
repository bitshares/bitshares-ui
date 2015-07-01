import React, {Link} from "react";
import BaseComponent from "./BaseComponent";
import forms from "newforms";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import WalletStore from "stores/WalletStore"
import PrivateKeyActions from "actions/PrivateKeyActions";
import WalletSelect from "components/Wallet/WalletSelect";

class CreateAccount extends BaseComponent {
    constructor() {
        super();
        this.state = {validAccountName: false};
    }

    //shouldComponentUpdate this.refs.wallet_selector is locked or this.state change
    
    onFormChange() {
        let form = this.refs.accountForm.getForm();
        let isValid = form.validate();
        // TODP: validate account name
        this.setState({validAccountName: isValid});
    }
    
    getCurrentWalletName() {
        var wallet_selector = this.refs.wallet_selector
        if( ! wallet_selector.isSelecedAndUnlocked())
            return null
        return wallet_selector.state.current_wallet
    }

    onSubmit(e) {
        e.preventDefault();
        let form = this.refs.accountForm.getForm();
        let isValid = form.validate();
        let name = form.cleanedData.name;
        var wallet_public_name = this.getCurrentWalletName()
        
        if(isValid && wallet_public_name) {
            AccountActions.createAccount(name, wallet_public_name).then( () => {
                this.context.router.transitionTo("account", {name: name})
                //return AccountActions.getAccount(name).then( () => {
                //    let account_store_state = AccountStore.getState();
                //    let account = account_store_state.browseAccounts.get(account_store_state.account_name_to_id[name]);
                //    privkey: keys_data.owner_privkey.toWif(),
                //    pubkey: keys_data.owner_pubkey.toBtsPublic()
                //    let owner_key = {
                //        id: "owner:" + name,
                //        key_id: account.owner.auths[0][0],
                //        private_id: owner_private_object.id
                //    };
                //    let active_key = {
                //        id: "active:" + name,
                //        key_id: account.active.auths[0][0],
                //        private_id: active_private_object.id
                //    };
                //    PrivateKeyActions.addKey(owner_key)
                //    this.context.router.transitionTo("account", {name: name});
                //});
            });
        }
    }

    render() {
        
        var wallets = WalletStore.getState().wallets
        
        //<Link to="create-wallet">Create Wallet</Link>
        if( ! wallets.count())
            return <div className="grid-block vertical">
                <div className="grid-content">
                    <label>Wallet Setup Required</label>
                    <div>
                        <a href="/#/create-wallet">Create Wallet</a>
                    </div>
                </div>
            </div>
        
        let AccountForm = forms.Form.extend({
            errorCssClass: "has-error",
            name: forms.CharField({ initial: "", placeholder: "Account Name" }),
            clean: ()=> {
                var wallet_selector = this.refs.wallet_selector
                if( ! wallet_selector.isSelecedAndUnlocked())
                    throw forms.ValidationError("Unlock Wallet")
            }
        });
        
        let buttonClass = classNames("button", {disabled: !this.state.validAccountName});
        return <div className="grid-block vertical">
            <div className="grid-block page-layout">
                <div className="grid-block medium-4">
                    <div className="grid-content">
                        <h4>Create New Account</h4>
                        <WalletSelect ref="wallet_selector" unlock="true"/>
                        <br/>
                        <form onSubmit={this.onSubmit.bind(this)} onChange={this.onFormChange.bind(this)} noValidate>
                            <forms.RenderForm form={AccountForm} ref="accountForm"/>
                            <button className={buttonClass}>CREATE ACCOUNT</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>;
    }
}

CreateAccount.contextTypes = {router: React.PropTypes.func.isRequired};

export default CreateAccount;
