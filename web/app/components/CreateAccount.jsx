import React from "react";
import forms from "newforms";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountNameInput from "./Forms/AccountNameInput";
import PasswordInput from "./Forms/PasswordInput";
import WalletDb from "stores/WalletDb";
import notify from 'actions/NotificationActions';

class CreateAccount extends React.Component {
    constructor() {
        super();
        this.state = {validAccountName: false};
    }

    onAccountNameChange(e) {
        this.setState({validAccountName: this.refs.account_name.valid()});
    }

    createAccount(name) {
        return AccountActions.createAccount(name).then(() => {
            notify.addNotification({
                message: `Successfully created account: ${name}`,
                level: "success",
                autoDismiss: 10
            });
            this.context.router.transitionTo("account_name", {name: name});
        }).catch(error => {
            // Show in GUI
            console.log("ERROR AccountActions.createAccount", error);
            notify.addNotification({
                message: `Failed to create account: ${name}`,
                level: "error",
                autoDismiss: 10
            });
        });
    }

    createWallet(account_name, password) {
        return WalletDb.onCreateWallet(
            account_name,
            password,
            null, //this.state.brainkey,
            true //unlock
        ).then(()=> {
            console.log("Congratulations, your wallet was successfully created.");
        }).catch(err => {
            console.log("CreateWallet failed:", err);
            notify.addNotification({
                message: `Failed to create wallet: ${err}`,
                level: "error",
                autoDismiss: 10
            })
        });
    }

    onSubmit(e) {
        e.preventDefault();
        let account_name = this.refs.account_name.value();

        if (WalletDb.getWallet()) {
            this.createAccount(account_name);
        } else {
            let password = this.refs.password.value();
            this.createWallet(account_name, password).then(() => this.createAccount(account_name));
        }
    }

    render() {
        let buttonClass = classNames("button", {disabled: !this.state.validAccountName});

        return (
            <div className="grid-block vertical">
                <div className="grid-content">
                    <div className="content-block">
                        <br/>

                        <h3>Create New Account</h3>
                        <br/>

                        <form className="medium-3" onSubmit={this.onSubmit.bind(this)} noValidate>
                            <AccountNameInput ref="account_name"
                                              onChange={this.onAccountNameChange.bind(this)}
                                              accountShouldNotExist={true}/>
                            {WalletDb.getWallet() ? null :
                                <PasswordInput ref="password" confirmation={true}/>
                            }
                            <button className={buttonClass}>Create Account</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

CreateAccount.contextTypes = {router: React.PropTypes.func.isRequired};

export default CreateAccount;
