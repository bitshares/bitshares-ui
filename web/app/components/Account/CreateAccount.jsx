import React from "react";
import forms from "newforms";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import AccountNameInput from "./../Forms/AccountNameInput";
import PasswordInput from "./../Forms/PasswordInput";
import WalletDb from "stores/WalletDb";
import notify from 'actions/NotificationActions';
import {Link} from "react-router";
import AccountImage from "./AccountImage";
import WalletUnlock from "../Wallet/WalletUnlock";
import AccountSelect from "../Forms/AccountSelect";


class CreateAccount extends React.Component {
    constructor() {
        super();
        this.state = {validAccountName: false, accountName: "", validPassword: false, registrar_account: null};
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.accountName !== this.state.accountName
               || nextState.validAccountName !== this.state.validAccountName
               || nextState.validPassword !== this.state.validPassword
               || nextState.registrar_account !== this.state.registrar_account;
    }

    onAccountNameChange(e) {
        let state = {validAccountName: e.valid};
        if(e.value || e.value === "") state.accountName = e.value;
        this.setState(state);
    }

    onPasswordChange(e) {
        this.setState({validPassword: e.valid});
    }

    createAccount(name) {
        let registrar_account_id = null;

        // if(this.state.registrar_account) {
        //     let res = AccountStore.getState().cachedAccounts.findEntry(a => a.name === this.state.registrar_account);
        //     if(res && res.length === 2) registrar_account_id = res[1].id;
        // }
        return AccountActions.createAccount(name, this.state.registrar_account, this.state.registrar_account).then(() => {
            notify.addNotification({
                message: `Successfully created account: ${name}`,
                level: "success",
                autoDismiss: 10
            });
            this.context.router.transitionTo("account", {account_name: name});
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

    onRegistrarAccountChange(registrar_account) {
        this.setState({registrar_account});
    }

    render() {
        let account_store_state = AccountStore.getState();
        let my_accounts = account_store_state.myAccounts.map(name => name);
        let first_account = my_accounts.size === 0;
        let valid = this.state.validAccountName;
        if (first_account) valid = valid && this.state.validPassword;
        else valid = valid && this.state.registrar_account;
        let buttonClass = classNames("button", {disabled: !valid});
        return (
            <div className="grid-block vertical">
                <div className="grid-content">
                    <div className="content-block center-content">
                        <div className="page-header">
                        {
                            first_account ?
                                (<div>
                                    <h1>Welcome to Graphene</h1>
                                    <h3>Please create an account</h3>
                                </div>) :
                                (
                                    <h3>Create account</h3>
                                )
                        }
                        </div>
                        {WalletDb.getWallet() ? <WalletUnlock/> : null}
                        <form className="medium-3" onSubmit={this.onSubmit.bind(this)} noValidate>
                            <AccountNameInput ref="account_name"
                                              onChange={this.onAccountNameChange.bind(this)}
                                              accountShouldNotExist={true}/>
                            {this.state.accountName && this.state.validAccountName ?
                                <div className="form-group">
                                    <label>Identicon</label>
                                    <AccountImage account={this.state.accountName}/>
                                </div> :
                                null
                            }
                            {WalletDb.getWallet() ?
                                null :
                                <PasswordInput ref="password" confirmation={true} onChange={this.onPasswordChange.bind(this)}/>
                            }
                            {
                                first_account ? null : (
                                    <div className="full-width-content form-group">
                                        <label>Pay from</label>
                                        <AccountSelect ref="pay_from" account_names={my_accounts} onChange={this.onRegistrarAccountChange.bind(this)}/>
                                    </div>)
                            }
                            <button className={buttonClass}>Create Account</button>
                            <br/>
                            <br/>
                            <Link to="existing-account">Balance Import</Link>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

CreateAccount.contextTypes = {router: React.PropTypes.func.isRequired};

export default CreateAccount;
