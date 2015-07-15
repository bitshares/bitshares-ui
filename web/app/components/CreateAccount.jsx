import React from "react";
import {Link} from "react-router";
import forms from "newforms";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import WalletDb from "stores/WalletDb";
import Wallet from "components/Wallet/Wallet";

class CreateAccount extends React.Component {
    constructor() {
        super();
        this.state = {validAccountName: false};
    }

    onFormChange() {
        let form = this.refs.accountForm.getForm();
        let isValid = form.validate();
        // TODP: validate account name
        this.setState({validAccountName: isValid});
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
        let AccountForm = forms.Form.extend({
            errorCssClass: "has-error",
            name: forms.CharField({ initial: "", placeholder: "Account Name" }),
            clean: ()=> {
                if(WalletDb.isLocked()) {
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
                            <Wallet>
                                <form onSubmit={this.onSubmit.bind(this)} onChange={this.onFormChange.bind(this)} noValidate>
                                    <forms.RenderForm form={AccountForm} ref="accountForm"/>
                                    <button className={buttonClass}>CREATE ACCOUNT</button>
                                </form>
                            </Wallet>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

CreateAccount.contextTypes = {router: React.PropTypes.func.isRequired};

export default CreateAccount;
