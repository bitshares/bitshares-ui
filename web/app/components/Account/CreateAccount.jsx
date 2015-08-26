import React from "react";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import AccountNameInput from "./../Forms/AccountNameInput";
import PasswordInput from "./../Forms/PasswordInput";
import WalletDb from "stores/WalletDb";
import notify from 'actions/NotificationActions';
import {Link} from "react-router";
import AccountImage from "./AccountImage";
import AccountSelect from "../Forms/AccountSelect";
import WalletUnlockActions from "actions/WalletUnlockActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import LoadingIndicator from "../LoadingIndicator";


class CreateAccount extends React.Component {
    constructor() {
        super();
        this.state = {validAccountName: false, accountName: "", validPassword: false, registrar_account: null, loading: false};
        this.onFinishConfirm = this.onFinishConfirm.bind(this)
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.accountName !== this.state.accountName
               || nextState.validAccountName !== this.state.validAccountName
               || nextState.validPassword !== this.state.validPassword
               || nextState.registrar_account !== this.state.registrar_account
               || nextState.loading !== this.state.loading;
    }

    onAccountNameChange(e) {
        let state = {validAccountName: e.valid};
        if(e.value || e.value === "") state.accountName = e.value;
        this.setState(state);
    }

    onPasswordChange(e) {
        this.setState({validPassword: e.valid});
    }

    onFinishConfirm(confirm_store_state) {
        if(confirm_store_state.broadcast && confirm_store_state.closed && confirm_store_state.broadcasted_transaction) {
            let trx_obj = confirm_store_state.broadcasted_transaction.toObject();
            let op0 = trx_obj.operations[0];
            if(op0[0] === 5 && op0[1].name === this.state.accountName) {
                this.context.router.transitionTo("account", {account_name: this.state.accountName});
            }
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
        }
    }

    createAccount(name) {
        WalletUnlockActions.unlock().then(() => {
            this.setState({loading: true});
            AccountActions.createAccount(name, this.state.registrar_account, this.state.registrar_account).then(() => {
                if(this.state.registrar_account) {
                    this.setState({loading: false});
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else {
                    this.context.router.transitionTo("account", {account_name: name});
                }
            }).catch(error => {
                console.log("ERROR AccountActions.createAccount", error);
                const error_msg = error.base && error.base.length && error.base.length > 0 ? error.base[0] : "unknown error";
                notify.addNotification({
                    message: `Failed to create account: ${name} - ${error_msg}`,
                    level: "error",
                    autoDismiss: 10
                });
                this.setState({loading: false});
            });
        });
    }

    createWallet(account_name, password) {
        return WalletDb.onCreateWallet(
            account_name,
            password,
            null,
            true
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
        if(this.state.loading) return <LoadingIndicator/>;
        let account_store_state = AccountStore.getState();
        let my_accounts = account_store_state.myAccounts.map(name => name).toJS();
        let first_account = my_accounts.length === 0;
        let valid = this.state.validAccountName;
        if (!WalletDb.getWallet()) valid = valid && this.state.validPassword;
        if (!first_account) valid = valid && this.state.registrar_account;
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
