import React from "react";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountNameInput from "./Forms/AccountNameInput";
import PasswordInput from "./Forms/PasswordInput";
import WalletDb from "stores/WalletDb";
import notify from "actions/NotificationActions";
import Wallet from "components/Wallet/Wallet"

class CreateAccount extends React.Component {
    constructor() {
        super();
        this.state = {validAccountName: false};
    }

    onAccountNameChange() {
        this.setState({validAccountName: this.refs.account_name.valid()});
    }

    createAccount(name) {
        return AccountActions.createAccount(name).then(() => {
            notify.addNotification({
                message: `Successfully created account: ${name}`,
                level: "success",
                autoDismiss: 10
            });
            this.context.router.transitionTo("account", {name: name});
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

    onSubmit(e) {
        e.preventDefault();
        let name = this.refs.account_name.value();
        this.createAccount(name);
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
                        <Wallet>
                            <form className="medium-3" onSubmit={this.onSubmit.bind(this)} noValidate>
                                <AccountNameInput ref="account_name"
                                                  onChange={this.onAccountNameChange.bind(this)}
                                                  accountShouldNotExist={true}/>
                                
                                <button className={buttonClass}>Create Account</button>
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
