import React from "react";
import {connect} from "alt-react";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import AccountNameInput from "./../Forms/AccountNameInput";
import WalletDb from "stores/WalletDb";
import notify from "actions/NotificationActions";
import {Link} from "react-router/es";
import AccountSelect from "../Forms/AccountSelect";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import LoadingIndicator from "../LoadingIndicator";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {ChainStore, FetchChain, key} from "bitsharesjs/es";
import ReactTooltip from "react-tooltip";
import utils from "common/utils";
import SettingsActions from "actions/SettingsActions";
import WalletUnlockActions from "actions/WalletUnlockActions";
import Icon from "../Icon/Icon";
import CopyButton from "../Utility/CopyButton";

class CreateAccountPassword extends React.Component {
    static contextTypes = {
        router: React.PropTypes.object.isRequired
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
            show_identicon: false,
            step: 1,
            showPass: false,
            generatedPassword: ("P" + key.get_random_key().toWif()).substr(
                0,
                45
            ),
            confirm_password: "",
            understand_1: false,
            understand_2: false,
            understand_3: false
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);

        this.accountNameInput = null;
    }

    componentWillMount() {
        if (!WalletDb.getWallet()) {
            SettingsActions.changeSetting({
                setting: "passwordLogin",
                value: true
            });
        }
    }

    componentDidMount() {
        ReactTooltip.rebuild();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !utils.are_equal_shallow(nextState, this.state);
    }

    isValid() {
        let firstAccount = AccountStore.getMyAccounts().length === 0;
        let valid = this.state.validAccountName;
        if (!WalletDb.getWallet()) {
            valid = valid && this.state.validPassword;
        }
        if (!firstAccount) {
            valid = valid && this.state.registrar_account;
        }
        return valid && this.state.understand_1 && this.state.understand_2;
    }

    onAccountNameChange(e) {
        const state = {};
        if (e.valid !== undefined) state.validAccountName = e.valid;
        if (e.value !== undefined) state.accountName = e.value;
        if (!this.state.show_identicon) state.show_identicon = true;
        this.setState(state);
    }

    onFinishConfirm(confirm_store_state) {
        if (
            confirm_store_state.included &&
            confirm_store_state.broadcasted_transaction
        ) {
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();

            FetchChain("getAccount", this.state.accountName, undefined, {
                [this.state.accountName]: true
            }).then(() => {
                this.props.router.push("/wallet/backup/create?newAccount=true");
            });
        }
    }

    _unlockAccount(name, password) {
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: true
        });

        WalletDb.validatePassword(password, true, name);
        WalletUnlockActions.checkLock.defer();
    }

    createAccount(name, password) {
        let refcode = this.refs.refcode ? this.refs.refcode.value() : null;
        let referralAccount = AccountStore.getState().referralAccount;
        this.setState({loading: true});

        AccountActions.createAccountWithPassword(
            name,
            password,
            this.state.registrar_account,
            referralAccount || this.state.registrar_account,
            0,
            refcode
        )
            .then(() => {
                AccountActions.setPasswordAccount(name);
                // User registering his own account
                if (this.state.registrar_account) {
                    FetchChain("getAccount", name, undefined, {
                        [name]: true
                    }).then(() => {
                        this.setState({
                            step: 2,
                            loading: false
                        });
                        this._unlockAccount(name, password);
                    });
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else {
                    // Account registered by the faucet
                    FetchChain("getAccount", name, undefined, {
                        [name]: true
                    }).then(() => {
                        this.setState({
                            step: 2
                        });
                        this._unlockAccount(name, password);
                    });
                }
            })
            .catch(error => {
                console.log("ERROR AccountActions.createAccount", error);
                let error_msg =
                    error.base && error.base.length && error.base.length > 0
                        ? error.base[0]
                        : "unknown error";
                if (error.remote_ip) error_msg = error.remote_ip[0];
                notify.addNotification({
                    message: `Failed to create account: ${name} - ${error_msg}`,
                    level: "error",
                    autoDismiss: 10
                });
                this.setState({loading: false});
            });
    }

    onSubmit(e) {
        e.preventDefault();
        if (!this.isValid()) return;
        let account_name = this.accountNameInput.getValue();
        // if (WalletDb.getWallet()) {
        //     this.createAccount(account_name);
        // } else {
        let password = this.state.generatedPassword;
        this.createAccount(account_name, password);
    }

    onRegistrarAccountChange(registrar_account) {
        this.setState({registrar_account});
    }

    // showRefcodeInput(e) {
    //     e.preventDefault();
    //     this.setState({hide_refcode: false});
    // }

    _onInput(value, e) {
        this.setState({
            [value]:
                value === "confirm_password"
                    ? e.target.value
                    : !this.state[value],
            validPassword:
                value === "confirm_password"
                    ? e.target.value === this.state.generatedPassword
                    : this.state.validPassword
        });
    }

    _renderAccountCreateForm() {
        let {registrar_account} = this.state;

        let my_accounts = AccountStore.getMyAccounts();
        let firstAccount = my_accounts.length === 0;
        let valid = this.isValid();
        let isLTM = false;
        let registrar = registrar_account
            ? ChainStore.getAccount(registrar_account)
            : null;
        if (registrar) {
            if (registrar.get("lifetime_referrer") == registrar.get("id")) {
                isLTM = true;
            }
        }

        let buttonClass = classNames("submit-button button no-margin", {
            disabled: !valid || (registrar_account && !isLTM)
        });

        return (
            <div style={{textAlign: "left"}}>
                <form
                    style={{maxWidth: "60rem"}}
                    onSubmit={this.onSubmit.bind(this)}
                    noValidate
                >
                    <AccountNameInput
                        ref={ref => {
                            if (ref) {
                                this.accountNameInput = ref.refs.nameInput;
                            }
                        }}
                        cheapNameOnly={!!firstAccount}
                        onChange={this.onAccountNameChange.bind(this)}
                        accountShouldNotExist={true}
                        placeholder={counterpart.translate(
                            "wallet.account_public"
                        )}
                        noLabel
                    />

                    <section className="form-group">
                        <label className="left-label">
                            <Translate content="wallet.generated" />&nbsp;&nbsp;<span
                                className="tooltip"
                                data-html={true}
                                data-tip={counterpart.translate(
                                    "tooltip.generate"
                                )}
                            >
                                <Icon name="question-circle" />
                            </span>
                        </label>
                        <div style={{paddingBottom: "0.5rem"}}>
                            <span className="inline-label">
                                <input
                                    style={{
                                        maxWidth: "calc(30rem - 48px)",
                                        fontSize: "80%"
                                    }}
                                    disabled
                                    value={this.state.generatedPassword}
                                    type="text"
                                    className="input-button"
                                />
                                <CopyButton
                                    text={this.state.generatedPassword}
                                    tip="tooltip.copy_password"
                                    dataPlace="top"
                                />
                            </span>
                        </div>
                    </section>

                    <section>
                        <label className="left-label">
                            <Translate content="wallet.confirm_password" />
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={this.state.confirm_password}
                            onChange={this._onInput.bind(
                                this,
                                "confirm_password"
                            )}
                        />
                        {this.state.confirm_password &&
                        this.state.confirm_password !==
                            this.state.generatedPassword ? (
                            <div className="has-error">
                                <Translate content="wallet.confirm_error" />
                            </div>
                        ) : null}
                    </section>

                    <br />

                    <div
                        className="confirm-checks"
                        onClick={this._onInput.bind(this, "understand_3")}
                    >
                        <label
                            htmlFor="checkbox-1"
                            style={{position: "relative"}}
                        >
                            <input
                                type="checkbox"
                                id="checkbox-1"
                                onChange={() => {}}
                                checked={this.state.understand_3}
                                style={{
                                    position: "absolute",
                                    top: "-5px",
                                    left: "0"
                                }}
                            />
                            <div style={{paddingLeft: "30px"}}>
                                <Translate content="wallet.understand_3" />
                            </div>
                        </label>
                    </div>
                    <br />
                    <div
                        className="confirm-checks"
                        onClick={this._onInput.bind(this, "understand_1")}
                    >
                        <label
                            htmlFor="checkbox-2"
                            style={{position: "relative"}}
                        >
                            <input
                                type="checkbox"
                                id="checkbox-2"
                                onChange={() => {}}
                                checked={this.state.understand_1}
                                style={{
                                    position: "absolute",
                                    top: "-5px",
                                    left: "0"
                                }}
                            />
                            <div style={{paddingLeft: "30px"}}>
                                <Translate content="wallet.understand_1" />
                            </div>
                        </label>
                    </div>
                    <br />

                    <div
                        className="confirm-checks"
                        style={{paddingBottom: "1.5rem"}}
                        onClick={this._onInput.bind(this, "understand_2")}
                    >
                        <label
                            htmlFor="checkbox-3"
                            style={{position: "relative"}}
                        >
                            <input
                                type="checkbox"
                                id="checkbox-3"
                                onChange={() => {}}
                                checked={this.state.understand_2}
                                style={{
                                    position: "absolute",
                                    top: "-5px",
                                    left: "0"
                                }}
                            />
                            <div style={{paddingLeft: "30px"}}>
                                <Translate content="wallet.understand_2" />
                            </div>
                        </label>
                    </div>
                    {/* If this is not the first account, show dropdown for fee payment account */}
                    {firstAccount ? null : (
                        <div
                            className="full-width-content form-group no-overflow"
                            style={{paddingTop: 30}}
                        >
                            <label>
                                <Translate content="account.pay_from" />
                            </label>
                            <AccountSelect
                                account_names={my_accounts}
                                onChange={this.onRegistrarAccountChange.bind(
                                    this
                                )}
                            />
                            {registrar_account && !isLTM ? (
                                <div
                                    style={{textAlign: "left"}}
                                    className="facolor-error"
                                >
                                    <Translate content="wallet.must_be_ltm" />
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Submit button */}
                    {this.state.loading ? (
                        <LoadingIndicator type="three-bounce" />
                    ) : (
                        <button style={{width: "100%"}} className={buttonClass}>
                            <Translate content="account.create_account" />
                        </button>
                    )}

                    {/* Backup restore option */}
                    {/* <div style={{paddingTop: 40}}>
                    <label>
                        <Link to="/existing-account">
                            <Translate content="wallet.restore" />
                        </Link>
                    </label>

                    <label>
                        <Link to="/create-wallet-brainkey">
                            <Translate content="settings.backup_brainkey" />
                        </Link>
                    </label>
                </div> */}

                    {/* Skip to step 3 */}
                    {/* {(!hasWallet || firstAccount ) ? null :<div style={{paddingTop: 20}}>
                    <label>
                        <a onClick={() => {this.setState({step: 3});}}><Translate content="wallet.go_get_started" /></a>
                    </label>
                </div>} */}
                </form>
                {/* <br />
                <p>
                    <Translate content="wallet.bts_rules" unsafe />
                </p> */}
            </div>
        );
    }

    _renderAccountCreateText() {
        let my_accounts = AccountStore.getMyAccounts();
        let firstAccount = my_accounts.length === 0;

        return (
            <div>
                <h4
                    style={{
                        fontWeight: "normal",
                        fontFamily: "Roboto-Medium, arial, sans-serif",
                        fontStyle: "normal",
                        paddingBottom: 15
                    }}
                >
                    <Translate content="wallet.wallet_password" />
                </h4>

                <Translate
                    style={{textAlign: "left"}}
                    unsafe
                    component="p"
                    content="wallet.create_account_password_text"
                />

                <Translate
                    style={{textAlign: "left"}}
                    component="p"
                    content="wallet.create_account_text"
                />

                {firstAccount ? null : (
                    <Translate
                        style={{textAlign: "left"}}
                        component="p"
                        content="wallet.not_first_account"
                    />
                )}
            </div>
        );
    }

    _renderBackup() {
        return (
            <div className="backup-submit">
                <p>
                    <Translate unsafe content="wallet.password_crucial" />
                </p>

                <div>
                    {!this.state.showPass ? (
                        <div
                            onClick={() => {
                                this.setState({showPass: true});
                            }}
                            className="button"
                        >
                            <Translate content="wallet.password_show" />
                        </div>
                    ) : (
                        <div>
                            <h5>
                                <Translate content="settings.password" />:
                            </h5>
                            <p
                                style={{
                                    fontWeight: "normal",
                                    fontFamily:
                                        "Roboto-Medium, arial, sans-serif",
                                    fontStyle: "normal",
                                    textAlign: "center"
                                }}
                            >
                                {this.state.generatedPassword}
                            </p>
                        </div>
                    )}
                </div>
                <div className="divider" />
                <p className="txtlabel warning">
                    <Translate unsafe content="wallet.password_lose_warning" />
                </p>

                <div
                    style={{width: "100%"}}
                    onClick={() => {
                        this.context.router.push("/");
                    }}
                    className="button"
                >
                    <Translate content="wallet.ok_done" />
                </div>
            </div>
        );
    }

    _renderGetStarted() {
        return (
            <div>
                <table className="table">
                    <tbody>
                        <tr>
                            <td>
                                <Translate content="wallet.tips_dashboard" />:
                            </td>
                            <td>
                                <Link to="/">
                                    <Translate content="header.dashboard" />
                                </Link>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <Translate content="wallet.tips_account" />:
                            </td>
                            <td>
                                <Link
                                    to={`/account/${
                                        this.state.accountName
                                    }/overview`}
                                >
                                    <Translate content="wallet.link_account" />
                                </Link>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <Translate content="wallet.tips_deposit" />:
                            </td>
                            <td>
                                <Link to="/deposit-withdraw">
                                    <Translate content="wallet.link_deposit" />
                                </Link>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <Translate content="wallet.tips_transfer" />:
                            </td>
                            <td>
                                <Link to="/transfer">
                                    <Translate content="wallet.link_transfer" />
                                </Link>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <Translate content="wallet.tips_settings" />:
                            </td>
                            <td>
                                <Link to="/settings">
                                    <Translate content="header.settings" />
                                </Link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    _renderGetStartedText() {
        return (
            <div>
                <p
                    style={{
                        fontWeight: "normal",
                        fontFamily: "Roboto-Medium, arial, sans-serif",
                        fontStyle: "normal"
                    }}
                >
                    <Translate content="wallet.congrat" />
                </p>

                <p>
                    <Translate content="wallet.tips_explore_pass" />
                </p>

                <p>
                    <Translate content="wallet.tips_header" />
                </p>

                <p className="txtlabel warning">
                    <Translate content="wallet.tips_login" />
                </p>
            </div>
        );
    }

    render() {
        let {step} = this.state;
        // let my_accounts = AccountStore.getMyAccounts();
        // let firstAccount = my_accounts.length === 0;
        return (
            <div className="sub-content">
                <div>
                    {step === 2 ? (
                        <p
                            style={{
                                fontWeight: "normal",
                                fontFamily: "Roboto-Medium, arial, sans-serif",
                                fontStyle: "normal"
                            }}
                        >
                            <Translate content={"wallet.step_" + step} />
                        </p>
                    ) : null}

                    {step === 3 ? this._renderGetStartedText() : null}

                    {step === 1 ? (
                        <div>{this._renderAccountCreateForm()}</div>
                    ) : step === 2 ? (
                        this._renderBackup()
                    ) : (
                        this._renderGetStarted()
                    )}
                </div>
            </div>
        );
    }
}

export default connect(CreateAccountPassword, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {};
    }
});
