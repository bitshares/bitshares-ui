import React from "react";
import forms from "newforms";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import Wallet from "./Wallet/Wallet";
import AccountNameInput from "./Forms/AccountNameInput"

class CreateAccount extends React.Component {
    constructor() {
        super();
        this.state = {validAccountName: false};
    }

    onFormChange() {
        console.log("[CreateAccount.jsx:14] ----- onFormChange ----->");
        // TODP: validate account name
        //this.setState({validAccountName: isValid});
    }

    onAccountNameChange(e) {
        console.log("[CreateAccount.jsx:21] ----- onAccountNameChange ----->", this.refs.account_name.valid());
        this.setState({validAccountName: this.refs.account_name.valid()});
    }

    onSubmit(e) {
        e.preventDefault();
        let name = this.refs.account_name.value();

        AccountActions.createAccount(name).then(() => {
            this.props.addNotification({
                message: `Successfully created account: ${name}`,
                level: "success",
                autoDismiss: 10
            });
            this.context.router.transitionTo("account", {name: name});
        }).catch(error => {
            // Show in GUI
            console.log("ERROR AccountActions.createAccount", error);
            this.props.addNotification({
                message: `Failed to create account: ${name}`,
                level: "error",
                autoDismiss: 10
            });
        });
    }

    render() {
        let buttonClass = classNames("button", {disabled: !this.state.validAccountName});

        return (
            <div className="grid-block vertical page-layout">
                <div className="grid-block medium-4">
                    <div className="content-block">
                        <h3>Create New Account</h3>
                        <br/>
                        <Wallet>
                        <form onSubmit={this.onSubmit.bind(this)} onChange={this.onFormChange.bind(this)} noValidate>
                            <AccountNameInput ref="account_name"
                                              onChange={this.onAccountNameChange.bind(this)}
                                              accountShouldNotExist={true}
                                />
                            <button className={buttonClass}>CREATE ACCOUNT</button>
                        </form>
                        </Wallet>
                    </div>
                </div>
            </div>
        );
    }
}

CreateAccount.contextTypes = {router: React.PropTypes.func.isRequired};

export default CreateAccount;
