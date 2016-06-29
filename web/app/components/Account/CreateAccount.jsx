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
import {ChainStore, FetchChain} from "graphenejs-lib";

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
        let firstAccount = AccountStore.getMyAccounts().length === 0;
        let valid = this.state.validAccountName;
        if (!WalletDb.getWallet()) valid = valid && this.state.validPassword;
        if (!firstAccount) valid = valid && this.state.registrar_account;
        return valid;
    }

    onAccountNameChange(e) {
        const state = {};
        if(e.valid !== undefined) state.validAccountName = e.valid;
        if(e.value !== undefined) state.accountName = e.value;
        if (!this.state.show_identicon) state.show_identicon = true;
        this.setState(state);
    }

    onPasswordChange(e) {
        this.setState({validPassword: e.valid});
    }

    onFinishConfirm(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();

            FetchChain("getAccount", this.state.accountName).then(() => {
                console.log("onFinishConfirm");
                this.props.history.pushState(null, `/wallet/backup/create?newAccount=true`);    
            });
        }
    }

    createAccount(name) {
        let refcode = this.refs.refcode ? this.refs.refcode.value() : null;
        WalletUnlockActions.unlock().then(() => {
            this.setState({loading: true});
            AccountActions.createAccount(name, this.state.registrar_account, this.state.registrar_account, 0, refcode).then(() => {
                // User registering his own account
                if(this.state.registrar_account) {
                    this.setState({loading: false});
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else { // Account registered by the faucet
                    console.log("account registed by faucet");
                    this.props.history.pushState(null, `/wallet/backup/create?newAccount=true`);
                    // this.props.history.pushState(null, `/account/${name}/overview`);
                    
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
        let {registrar_account} = this.state;

        let my_accounts = AccountStore.getMyAccounts()
        let firstAccount = my_accounts.length === 0;

        let hasWallet = WalletDb.getWallet();
        let valid = this.isValid();

        let isLTM = false;
        let registrar = registrar_account ? ChainStore.getAccount(registrar_account) : null; 
        if (registrar) {
            if( registrar.get( 'lifetime_referrer' ) == registrar.get( 'id' ) ) {
                isLTM = true;
            }
        }

        let buttonClass = classNames("button no-margin", {disabled: (!valid || (registrar_account && !isLTM))});

        let header_items = {
            icon: <div className="form-group">
                <label><Translate content="account.identicon"/></label>
                <AccountImage account={this.state.validAccountName ? this.state.accountName : null}/>
            </div>,
            title: firstAccount ?
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

            <div className="grid-container">
                <div className="create-account-header">
                    {header}
                </div>
                <div className="content-block center-content">
                        <form
                            style={{maxWidth: "45rem"}}
                            onSubmit={this.onSubmit.bind(this)}
                            noValidate
                        >
                            <div className="grid-content">
                                <Translate style={{textAlign: "left"}} component="p" content="wallet.create_account_text" />
                                {firstAccount ? <Translate style={{textAlign: "left"}} component="p" content="wallet.first_account_paid" /> : null}
                                <AccountNameInput
                                    ref={(ref) => {if (ref) {this.accountNameInput = ref.refs.nameInput;}}}
                                    cheapNameOnly={firstAccount}
                                    onChange={this.onAccountNameChange.bind(this)}
                                    accountShouldNotExist={true}
                                />
                            </div>
                            {hasWallet ?
                                null :
                                <div className="grid-content">
                                    <div style={{
                                        textAlign: "left",
                                        paddingBottom: 10
                                    }}>
                                        <Translate component="p" content="wallet.account_create_wallet_text" />
                                    </div>
                                    <PasswordInput ref="password" confirmation={true} onChange={this.onPasswordChange.bind(this)}/>
                                </div>
                            }
                            {
                            firstAccount ? null : (
                                <div className="full-width-content grid-content form-group no-overflow">
                                    <label><Translate content="account.pay_from" /></label>
                                    <AccountSelect
                                        account_names={my_accounts}
                                        onChange={this.onRegistrarAccountChange.bind(this)}
                                    />
                                    {(registrar_account && !isLTM) ? <div style={{textAlign: "left"}} className="facolor-error"><Translate content="wallet.must_be_ltm" /></div> : null}
                                </div>)
                            }
                            {this.state.hide_refcode ? null :
                                <div>
                                    <RefcodeInput ref="refcode" label="refcode.refcode_optional" expandable={true}/>
                                    <br/>
                                </div>
                            }
                            {this.state.loading ?  <LoadingIndicator type="three-bounce"/> : <button className={buttonClass}><Translate content="account.create_account" /></button>}
                            
                            <div style={{paddingTop: 20}}>
                                <label className="inline">
                                    <Link to="/existing-account">
                                        <Translate content="wallet.restore" />
                                    </Link>
                                </label>
                            </div>
                        </form>
                </div>
            </div>
        );
    }
}

export default CreateAccount;
