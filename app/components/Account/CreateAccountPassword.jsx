import React from "react";
import {connect} from "alt-react";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import AccountNameInput from "./../Forms/AccountNameInput";
import WalletDb from "stores/WalletDb";
import {Link} from "react-router-dom";
/*import AccountSelect from "../Forms/AccountSelect";*/
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import LoadingIndicator from "../LoadingIndicator";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {ChainStore, FetchChain, key} from "tuscjs";
import ReactTooltip from "react-tooltip";
import utils from "common/utils";
import SettingsActions from "actions/SettingsActions";
import WalletUnlockActions from "actions/WalletUnlockActions";
import Icon from "../Icon/Icon";
import CopyButton from "../Utility/CopyButton";
import {withRouter} from "react-router-dom";
import {scroller} from "react-scroll";
import {Notification, Tooltip} from "bitshares-ui-style-guide";
import ReCAPTCHA from "react-google-recaptcha";
import SettingsStore from "stores/SettingsStore";
import MetaTag from "../Layout/MetaTag";

function isTestNet(url) {
    return (
        !__TESTNET__ &&
        (url.indexOf("testnet") !== -1 || url.indexOf("test2") !== -1)
    );
}

class CreateAccountPassword extends React.Component {
    constructor() {
        super();
        this.state = {
            res: {},
            wif_priv_key: "",
            keyPhrase: "",
            pub_key: "",
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
            refAcct: AccountStore.getState().referralAccount,
            confirm_password: "",
            understand_1: false,
            understand_2: false,
            understand_3: false
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);

        this.accountNameInput = null;

        this.scrollToInput = this.scrollToInput.bind(this);
        this.recaptchaRef = React.createRef();
    }

    componentDidMount() {
        if (!WalletDb.getWallet()) {
            SettingsActions.changeSetting({
                setting: "passwordLogin",
                value: true
            });
        }
        ReactTooltip.rebuild();
        this.scrollToInput();

        let faucetAddress = SettingsStore.getSetting("faucet_address");

        if (this.props.connectedNode && isTestNet(this.props.connectedNode)) {
            faucetAddress = "http://3.135.40.183";
        }

        fetch(faucetAddress + "/tusc/api/wallet/suggest_brain_key", {
            method: "get",
            headers: {
                Accept: "application/json"
            }
        }).then(r =>
            r.json().then(res => {
                if (res) {
                    this.setState({
                        data: res.result,
                        keyPhrase: res.result.brain_priv_key,
                        pub_key: res.result.pub_key,
                        wif_priv_key: res.result.wif_priv_key
                    });
                } else if (!res || (res && res.error)) {
                    // console.log(res.error);
                    reject(res.error);
                }
            })
        );
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !utils.are_equal_shallow(nextState, this.state);
    }

    scrollToInput() {
        scroller.scrollTo("scrollToInput", {
            duration: 1500,
            delay: 100,
            smooth: true,
            containerId: "accountForm"
        });
    }

    isValid() {
        // let firstAccount = AccountStore.getMyAccounts().length === 0;
        let valid = this.state.validAccountName;
        if (!WalletDb.getWallet()) {
            valid = valid && this.state.validPassword;
        }
        // if (!firstAccount) {
        //     valid = valid && this.state.registrar_account;
        // }
        return (
            valid &&
            this.state.understand_1 &&
            this.state.understand_2 &&
            this.state.understand_3
        );
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
                this.props.history.push(
                    "/wallet/backup/create?newAccount=true"
                );
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

        this.setState({loading: false});
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

                Notification.error({
                    message: counterpart.translate(
                        "notifications.account_create_failure",
                        {
                            account_name: name,
                            error_msg: error_msg
                        }
                    )
                });

                this.setState({loading: false});
            });
    }

    onSubmit(e) {
        e.preventDefault();
        if (!this.isValid()) return;
        let referralAccount = AccountStore.getState().referralAccount;
        let faucetAddress = SettingsStore.getSetting("faucet_address");

        if (this.props.connectedNode && isTestNet(this.props.connectedNode)) {
            faucetAddress = "http://3.135.40.183";
        }

        this.recaptchaRef.current.executeAsync().then(token => {
            fetch(faucetAddress + "/tusc/api/wallet/register_account", {
                method: "post",
                headers: {
                    Accept: "application/json",
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    account_name: this.state.accountName,
                    public_key: this.state.pub_key,
                    recaptcha_response: token,
                    referrer: referralAccount
                })
            }).then(r =>
                r.json().then(res => {
                    if (res && !res.error) {
                        console.log(res.result);
                        alert("Successfully Created!");
                        this.props.history.push("/login");
                    } else if (!res || (res && res.error)) {
                        alert(res.error);
                    }
                })
            );
        });
    }

    onRegistrarAccountChange(registrar_account) {
        this.setState({registrar_account});
    }

    _onInput(value, e) {
        this.setState({
            [value]:
                value === "confirm_password"
                    ? e.target.value
                    : !this.state[value],
            validPassword:
                value === "confirm_password"
                    ? e.target.value === this.state.wif_priv_key
                    : this.state.validPassword
        });
    }

    _renderAccountCreateForm() {
        let {registrar_account} = this.state;

        /*let my_accounts = AccountStore.getMyAccounts();*/
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
                        cheapNameOnly={false}
                        onChange={this.onAccountNameChange.bind(this)}
                        accountShouldNotExist={true}
                        placeholder={counterpart.translate(
                            "wallet.account_public"
                        )}
                        noLabel
                    />

                    <section className="form-group">
                        <label className="left-label">
                            <Translate content="wallet.generated_private" />
                            &nbsp;&nbsp;
                            <Tooltip
                                title={counterpart.translate(
                                    "tooltip.generate_private"
                                )}
                            >
                                <span className="tooltip">
                                    <Icon
                                        name="question-circle"
                                        title="icons.question_circle"
                                    />
                                </span>
                            </Tooltip>
                        </label>
                        <div style={{paddingBottom: "0.5rem"}}>
                            <span className="inline-label">
                                <textarea
                                    style={{
                                        padding: "0px",
                                        marginBottom: "0px"
                                    }}
                                    rows="3"
                                    value={this.state.wif_priv_key}
                                    readOnly
                                    disabled
                                >
                                    {this.state.wif_priv_key}
                                </textarea>
                                <CopyButton
                                    text={this.state.wif_priv_key}
                                    tip="tooltip.copy_password"
                                    dataPlace="top"
                                />
                            </span>
                        </div>
                    </section>
                    {/* ^Generated Private Key  */}

                    <section className="form-group">
                        <label className="left-label">
                            <Translate content="wallet.generated_public" />
                            &nbsp;&nbsp;
                            <Tooltip
                                title={counterpart.translate(
                                    "tooltip.generate_public"
                                )}
                            >
                                <span className="tooltip">
                                    <Icon
                                        name="question-circle"
                                        title="icons.question_circle"
                                    />
                                </span>
                            </Tooltip>
                        </label>
                        <div style={{paddingBottom: "0.5rem"}}>
                            <span className="inline-label">
                                <textarea
                                    style={{
                                        padding: "0px",
                                        marginBottom: "0px"
                                    }}
                                    rows="3"
                                    value={this.state.pub_key}
                                    readOnly
                                    disabled
                                >
                                    {this.state.pub_key}
                                </textarea>
                                <CopyButton
                                    text={this.state.pub_key}
                                    tip="tooltip.copy_password"
                                    dataPlace="top"
                                />
                            </span>
                        </div>
                    </section>
                    {/* ^Generated Public Key  */}

                    <section className="form-group">
                        <label className="left-label">
                            <Translate content="wallet.generated_phrase" />
                            &nbsp;&nbsp;
                            <Tooltip
                                title={counterpart.translate(
                                    "tooltip.generate_phrase"
                                )}
                            >
                                <span className="tooltip">
                                    <Icon
                                        name="question-circle"
                                        title="icons.question_circle"
                                    />
                                </span>
                            </Tooltip>
                        </label>
                        <div style={{paddingBottom: "0.5rem"}}>
                            <span className="inline-label">
                                <textarea
                                    style={{
                                        padding: "0px",
                                        marginBottom: "0px"
                                    }}
                                    rows="5"
                                    value={this.state.keyPhrase}
                                    readOnly
                                    disabled
                                >
                                    {this.state.keyPhrase}
                                </textarea>
                                <CopyButton
                                    text={this.state.keyPhrase}
                                    tip="tooltip.copy_password"
                                    dataPlace="top"
                                />
                            </span>
                        </div>
                    </section>
                    {/* ^Generated  Key Phrase */}

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
                            this.state.wif_priv_key ? (
                            <div className="has-error">
                                <Translate content="wallet.confirm_error" />
                            </div>
                        ) : null}
                    </section>
                    <br />
                    <section>
                        <div>
                            This site is protected by reCAPTCHA and Google.
                            <br></br>
                            <a href="https://policies.google.com/privacy">
                                Privacy Policy
                            </a>{" "}
                            and
                            <a href="https://policies.google.com/terms">
                                Terms of Service
                            </a>{" "}
                            apply.
                        </div>
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

                    {/* Submit button */}
                    {this.state.loading ? (
                        <LoadingIndicator type="three-bounce" />
                    ) : (
                        <button style={{width: "100%"}} className={buttonClass}>
                            <Translate content="account.create_account" />
                        </button>
                    )}
                </form>
            </div>
        );
    }

    _renderAccountCreateText() {
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

                {/* {firstAccount ? null : (
                    <Translate
                        style={{textAlign: "left"}}
                        component="p"
                        content="wallet.not_first_account"
                    />
                )} */}
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
                                {this.state.wif_priv_key}
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
                        this.props.history.push("/");
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
                                    to={`/account/${this.state.accountName}/overview`}
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
        return (
            <div
                className="sub-content"
                id="scrollToInput"
                name="scrollToInput"
            >
                <ReCAPTCHA
                    sitekey="6LeOYMYUAAAAADcHiQHtwC_VN7klQGLxnJr4N3x5"
                    size="invisible"
                    ref={this.recaptchaRef}
                />
                <MetaTag path="create-account/password" />
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

CreateAccountPassword = withRouter(CreateAccountPassword);

export default connect(CreateAccountPassword, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            connectedNode: SettingsStore.getState().settings.get("activeNode")
        };
    }
});
