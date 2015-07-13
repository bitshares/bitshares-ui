import React from "react";
import {Link} from "react-router";
// import BaseComponent from "./BaseComponent";
import forms from "newforms";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
// import AccountStore from "stores/AccountStore";
import WalletDb from "stores/WalletDb";
// import PrivateKeyActions from "actions/PrivateKeyActions";
import WalletSelect from "components/Wallet/WalletSelect";

class CreateAccount extends React.Component {
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
        let wallet_selector = this.refs.wallet_selector;
        if( !wallet_selector.isSelecedAndUnlocked()) {
            return null;
        }
        return wallet_selector.state.current_wallet;
    }

    onSubmit(e) {
        e.preventDefault();
        let form = this.refs.accountForm.getForm();
        let isValid = form.validate();
        let name = form.cleanedData.name;
        
        if(isValid) {
            AccountActions.createAccount(name).then( () => {
                this.props.addNotification({
                    message: `Successfully created account: ${name}`,
                    level: "success",
                    autoDismiss: 10
                });
                this.context.router.transitionTo("account", {name: name});
            }).catch( error => {
                // Show in GUI
                console.log("ERROR AccountActions.createAccount", error);
                this.props.addNotification({
                    message: `Failed to create account: ${name}`,
                    level: "error",
                    autoDismiss: 10
                });
            });
        }
    }

    render() {
        
        let wallets = WalletDb.wallets;
        
        //<Link to="create-wallet">Create Wallet</Link>
        if(!wallets.count()) {
            return (
                <div className="grid-block vertical page-layout">
                    <div className="grid-block">
                        <div className="grid-content text-center medium-4 medium-offset-4">
                            <label>No wallet found, please create a wallet first:</label>
                            <div>
                                <Link className="button" to="create-wallet">Create Wallet</Link>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        
        let AccountForm = forms.Form.extend({
            errorCssClass: "has-error",
            name: forms.CharField({ initial: "", placeholder: "Account Name" }),
            clean: ()=> {
                let wallet_selector = this.refs.wallet_selector;
                if( !wallet_selector.isSelecedAndUnlocked()) {
                    throw forms.ValidationError("Unlock Wallet");
                }
            }
        });
        
        let buttonClass = classNames("button", {disabled: !this.state.validAccountName});

        return (
            <div className="grid-block vertical page-layout">
                <div className="grid-block">
                    <div className="grid-block medium-4 medium-offset-4">
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
            </div>
        );
    }
}

CreateAccount.contextTypes = {router: React.PropTypes.func.isRequired};

export default CreateAccount;
