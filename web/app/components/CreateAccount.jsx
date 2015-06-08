import React from "react";
import BaseComponent from "./BaseComponent";
import forms from "newforms";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";

class CreateAccount extends BaseComponent {
    constructor() {
        super();
        this.state = {validAccountName: false};
    }

    onFormChange() {
        let form = this.refs.accountForm.getForm();
        let isValid = form.validate();
        // TODP: validate account name
        console.log("[CreateAccount.jsx:16] ----- onFormChange ----->", form, isValid);
        this.setState({validAccountName: isValid});
    }

    onSubmit(e) {
        e.preventDefault();
        let form = this.refs.accountForm.getForm();
        let isValid = form.validate();
        let name = form.cleanedData.name;
        console.log("[CreateAccount.jsx:19] ----- onSubmit ----->", form, isValid, name);
        if(isValid) {
            AccountActions.createAccount(name).then( () => {
                return AccountActions.getAccount(name).then( () => {
                    this.context.router.transitionTo("account", {name: name});
                });
            });
        }
    }

    render() {
        let AccountForm = forms.Form.extend({
            errorCssClass: "has-error",
            name: forms.CharField({ initial: "" })
        });
        let buttonClass = classNames("button", {success: this.state.validAccountName}, {disabled: !this.state.validAccountName});
        return <div className="grid-block vertical">
            <div className="grid-block page-layout">
                <div className="grid-block medium-4">
                    <div className="grid-content">
                        <h4>Create New Account</h4>
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
