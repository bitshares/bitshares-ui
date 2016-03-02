import React from "react";
import connectToStores from "alt/utils/connectToStores";
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
import WalletActions from "actions/WalletActions";
import Translate from "react-translate-component";
import RefcodeInput from "../Forms/RefcodeInput";
import {TransitionMotion, spring} from 'react-motion';

@connectToStores
class CreateAccount extends React.Component {

    static getStores() {
        return [AccountStore]
    };

    static getPropsFromStores() {
        return {}
    };

    constructor() {
        super();
        this.state = {
            validAccountName: false,
            accountName: "",
            validPassword: false,
            registrar_account: null,
            loading: false,
            hide_refcode: true,
            show_identicon: false
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);

        this.accountNameInput = null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.validAccountName !== this.state.validAccountName ||
            nextState.accountName !== this.state.accountName ||
            nextState.validPassword !== this.state.validPassword ||
            nextState.registrar_account !== this.state.registrar_account ||
            nextState.loading !== this.state.loading ||
            nextState.hide_refcode !== this.state.hide_refcode ||
            nextState.show_identicon !== this.state.show_identicon;
    }

    isValid() {
        let first_account = AccountStore.getMyAccounts().length === 0;
        let valid = this.state.validAccountName;
        if (!WalletDb.getWallet()) valid = valid && this.state.validPassword;
        if (!first_account) valid = valid && this.state.registrar_account;
        return valid;
    }

    onAccountNameChange(e) {
        const state = {};
        console.log("-- CreateAccount.onAccountNameChange -->", e.value);
        if(e.valid !== undefined) state.validAccountName = e.valid;
        if(e.value !== undefined) state.accountName = e.value;
        if (!this.state.show_identicon) state.show_identicon = true;
        this.setState(state);
    }

    onPasswordChange(e) {
        console.log("-- CreateAccount.onPasswordChange -->", e);
        this.setState({validPassword: e.valid});
    }

    onFinishConfirm(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            let trx_obj = confirm_store_state.broadcasted_transaction.toObject();
            let op0 = trx_obj.operations[0];
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();
            if(op0[0] === 5 && op0[1].name === this.state.accountName) {
                this.props.history.pushState(null, `/account/${this.state.accountName}/overview`);
            }
        }
    }

    createAccount(name) {
        let refcode = this.refs.refcode ? this.refs.refcode.value() : null;
        WalletUnlockActions.unlock().then(() => {
            this.setState({loading: true});
            AccountActions.createAccount(name, this.state.registrar_account, this.state.registrar_account, 0, refcode).then(() => {
                if(this.state.registrar_account) {
                    this.setState({loading: false});
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else {
                    this.props.history.pushState(null, `/account/${name}/overview`);
                }
            }).catch(error => {
                console.log("ERROR AccountActions.createAccount", error);
                let error_msg = error.base && error.base.length && error.base.length > 0 ? error.base[0] : "unknown error";
                if (error.remote_ip) error_msg = error.remote_ip[0];
                notify.addNotification({
                    message: `Failed to create account: ${name} - ${error_msg}`,
                    level: "error",
                    autoDismiss: 10
                });
                this.setState({loading: false});
            });
        });
    }

    createWallet(password) {
        return WalletActions.setWallet(
            "default", //wallet name
            password
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
        if (!this.isValid()) return;
        let account_name = this.accountNameInput.getValue();
        if (WalletDb.getWallet()) {
            this.createAccount(account_name);
        } else {
            let password = this.refs.password.value();
            this.createWallet(password).then(() => this.createAccount(account_name));
        }
    }

    onRegistrarAccountChange(registrar_account) {
        this.setState({registrar_account});
    }

    showRefcodeInput(e) {
        e.preventDefault();
        this.setState({hide_refcode: false});
    }

    getHeaderItemStyles() {
        let config = {};
        let d = {
            opacity: spring(1),
            top: spring(16)
        };
        if (this.state.show_identicon) config["icon"] = d;
        else config["title"] = d;
        return config;
    }

    headerItemWillEnter(key) {
        return {
            opacity: spring(0),
            top: spring(-50)
        };
    }

    headerItemWillLeave(key) {
        return {
            opacity: spring(0),
            top: spring(-50)
        };
    }

    render() {
        console.log("-- CreateAccount.render -->", this.state);
        let my_accounts = AccountStore.getMyAccounts();
        let first_account = my_accounts.length === 0;
        let valid = this.isValid();
        let buttonClass = classNames("button no-margin", {disabled: !valid});

        let header_items = {
            icon: <div className="form-group">
                <label><Translate content="account.identicon"/></label>
                <AccountImage account={this.state.validAccountName ? this.state.accountName : null}/>
            </div>,
            title: first_account ?
                    (<div>
                        <h1><Translate content="account.welcome"/></h1>
                        <h3><Translate content="account.please_create_account"/></h3>
                        <hr/>
                    </div>) :
                    (
                        <div>
                            <h1><Translate content="account.create_account"/></h1>
                            <hr/>
                        </div>
                    )
        };

        const header = <TransitionMotion
            styles={this.getHeaderItemStyles()}
            willEnter={this.headerItemWillEnter}
            willLeave={this.headerItemWillLeave}>
            {config =>
                <div>
                    {Object.keys(config).map(key =>
                        {
                            let style = config[key];
                            return <div key={key} style={{position: "absolute", left: 0, right: 0, ...style}}>
                                <div className="center-content">{header_items[key]}</div>
                            </div>;
                        })
                    }
                </div>
            }
        </TransitionMotion>

        return (
            <div className="grid-block vertical">
                <div className="grid-content">
                    <div className="create-account-header">
                        {header}
                    </div>
                    <div className="content-block center-content">
                        <div style={{width: '21em'}}>
                            <form onSubmit={this.onSubmit.bind(this)} noValidate>
                                <AccountNameInput ref={(ref) => {if (ref) {this.accountNameInput = ref.refs.nameInput;}}} cheapNameOnly={first_account}
                                                  onChange={this.onAccountNameChange.bind(this)}
                                                  accountShouldNotExist={true}/>

                                {WalletDb.getWallet() ?
                                    null :
                                    <PasswordInput ref="password" confirmation={true} onChange={this.onPasswordChange.bind(this)}/>
                                }
                                {
                                    first_account ? null : (
                                        <div className="full-width-content form-group">
                                            <label><Translate content="account.pay_from" /></label>
                                            <AccountSelect account_names={my_accounts}
                                                onChange={this.onRegistrarAccountChange.bind(this)}/>
                                        </div>)
                                }
                                {this.state.hide_refcode ? null :
                                    <div>
                                        <RefcodeInput ref="refcode" label="refcode.refcode_optional" expandable={true}/>
                                        <br/>
                                    </div>
                                }
                                {this.state.loading ?  <LoadingIndicator type="three-bounce"/> :<button className={buttonClass}><Translate content="account.create_account" /></button>}
                                <br/>
                                <br/>
                                <label className="inline"><Link to="/existing-account"><Translate content="account.existing_accounts" /></Link></label>
                                {false && this.state.hide_refcode ? <span>&nbsp; &bull; &nbsp;
                                    <label className="inline"><a href onClick={this.showRefcodeInput.bind(this)}><Translate content="refcode.enter_refcode"/></a></label>
                                </span> : null}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default CreateAccount;
