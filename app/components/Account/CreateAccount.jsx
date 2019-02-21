import React from "react";
import {connect} from "alt-react";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import AccountNameInput from "./../Forms/AccountNameInput";
import PasswordInput from "./../Forms/PasswordInput";
import WalletDb from "stores/WalletDb";
import notify from "actions/NotificationActions";
import {Link} from "react-router-dom";
import AccountSelect from "../Forms/AccountSelect";
import WalletUnlockActions from "actions/WalletUnlockActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import LoadingIndicator from "../LoadingIndicator";
import WalletActions from "actions/WalletActions";
import Translate from "react-translate-component";
import {ChainStore, FetchChain} from "bitsharesjs/es";
import {BackupCreate} from "../Wallet/Backup";
import ReactTooltip from "react-tooltip";
import utils from "common/utils";
import SettingsActions from "actions/SettingsActions";
import counterpart from "counterpart";
import {withRouter} from "react-router-dom";
import ReCAPTCHA from "../Utility/ReCAPTCHA";
import CryptoBridgeStore from "../../stores/CryptoBridgeStore";
import sha256 from "js-sha256";

class CreateAccount extends React.Component {
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
            us_citizen: null,
            understand_tos: null,
            understand_tos_version: null,
            understand_tos_hash: null,
            understand_tos_disclaimer: null,
            recaptchaToken: null
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);

        this.accountNameInput = null;
    }

    componentWillMount() {
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: false
        });
    }

    componentDidMount() {
        ReactTooltip.rebuild();
    }

    componentWillReceiveProps(np) {
        if (
            np.terms &&
            JSON.stringify(np.terms) !== JSON.stringify(this.props.terms)
        ) {
            this.setState({
                understand_tos_link: np.terms.link,
                understand_tos_version: np.terms.version,
                understand_tos_hash: sha256(np.terms.payload)
            });
        }
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

        return (
            valid &&
            this.state.understand_tos &&
            this.state.understand_tos_disclaimer &&
            this.state.understand_tos_hash &&
            this.state.understand_tos_version &&
            this.state.us_citizen !== null &&
            this.state.recaptchaToken
        );
    }

    onAccountNameChange(e) {
        const state = {};
        if (e.valid !== undefined) state.validAccountName = e.valid;
        if (e.value !== undefined) state.accountName = e.value;
        if (!this.state.show_identicon) state.show_identicon = true;
        this.setState(state);
    }

    onPasswordChange(e) {
        this.setState({validPassword: e.valid});
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
                console.log("onFinishConfirm");
                this.props.history.push(
                    "/wallet/backup/create?newAccount=true"
                );
            });
        }
    }

    createAccount(name, reCaptchaToken) {
        let refcode = this.refs.refcode ? this.refs.refcode.value() : null;
        let referralAccount = AccountStore.getState().referralAccount;
        WalletUnlockActions.unlock()
            .then(() => {
                this.setState({loading: true});

                AccountActions.createAccount(
                    name,
                    this.state.registrar_account,
                    referralAccount || this.state.registrar_account,
                    0,
                    refcode,
                    reCaptchaToken,
                    this.state.us_citizen,
                    this.state.understand_tos_version,
                    this.state.understand_tos_hash,
                    this.state.understand_tos_disclaimer
                )
                    .then(() => {
                        // User registering his own account
                        if (this.state.registrar_account) {
                            FetchChain("getAccount", name, undefined, {
                                [name]: true
                            }).then(() => {
                                this.setState({
                                    step: 2,
                                    loading: false
                                });
                            });
                            TransactionConfirmStore.listen(
                                this.onFinishConfirm
                            );
                        } else {
                            // Account registered by the faucet
                            FetchChain("getAccount", name, undefined, {
                                [name]: true
                            }).then(() => {
                                this.setState({
                                    step: 2,
                                    loading: false
                                });
                            });
                        }
                    })
                    .catch(error => {
                        console.log(
                            "ERROR AccountActions.createAccount",
                            error
                        );
                        let error_msg =
                            error.base &&
                            error.base.length &&
                            error.base.length > 0
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
            })
            .catch(() => {});
    }

    createWallet(password) {
        return WalletActions.setWallet(
            "default", //wallet name
            password
        )
            .then(() => {
                console.log(
                    "Congratulations, your wallet was successfully created."
                );
            })
            .catch(err => {
                console.log("CreateWallet failed:", err);
                notify.addNotification({
                    message: `Failed to create wallet: ${err}`,
                    level: "error",
                    autoDismiss: 10
                });
            });
    }

    onSubmit(e) {
        e.preventDefault();
        if (!this.isValid()) return;
        let account_name = this.accountNameInput.getValue();
        const {recaptchaToken} = this.state;

        if (recaptchaToken) {
            if (WalletDb.getWallet()) {
                this.createAccount(account_name, recaptchaToken);
            } else {
                let password = this.refs.password.value();
                this.createWallet(password).then(() =>
                    this.createAccount(account_name, recaptchaToken)
                );
            }
        }
    }

    onCitizenshipChange = e => {
        this.setState({
            us_citizen: e.currentTarget.value === "true"
        });
    };

    onTermsAndConditionsClick = e => {
        e.stopPropagation();
    };

    onRegistrarAccountChange(registrar_account) {
        this.setState({registrar_account});
    }

    // showRefcodeInput(e) {
    //     e.preventDefault();
    //     this.setState({hide_refcode: false});
    // }

    _renderAccountCreateForm() {
        let {registrar_account} = this.state;

        let my_accounts = AccountStore.getMyAccounts();
        let firstAccount = my_accounts.length === 0;
        let hasWallet = WalletDb.getWallet();
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
            <form
                style={{maxWidth: "40rem"}}
                onSubmit={this.onSubmit.bind(this)}
                noValidate
            >
                <p
                    style={{
                        fontWeight: "normal",
                        fontFamily: "Roboto-Medium, arial, sans-serif",
                        fontStyle: "normal"
                    }}
                >
                    {firstAccount ? (
                        <Translate content="wallet.create_w_a" />
                    ) : (
                        <Translate content="wallet.create_a" />
                    )}
                </p>
                <AccountNameInput
                    ref={ref => {
                        if (ref) {
                            this.accountNameInput = ref.refs.nameInput;
                        }
                    }}
                    cheapNameOnly={!!firstAccount}
                    onChange={this.onAccountNameChange.bind(this)}
                    accountShouldNotExist={true}
                    placeholder={counterpart.translate("wallet.account_public")}
                    noLabel
                />

                {/* Only ask for password if a wallet already exists */}
                {hasWallet ? null : (
                    <PasswordInput
                        ref="password"
                        confirmation={true}
                        onChange={this.onPasswordChange.bind(this)}
                        noLabel
                        checkStrength
                    />
                )}

                <section style={{paddingBottom: "1.5rem", textAlign: "left"}}>
                    <label className="left-label">
                        <Translate content="cryptobridge.account.are_you_us_citizen" />
                    </label>
                    <label
                        htmlFor="us_citizen_yes"
                        style={{display: "inline-block", marginRight: "1rem"}}
                    >
                        <input
                            name="us_citizen"
                            id="us_citizen_yes"
                            type="radio"
                            value="true"
                            onChange={this.onCitizenshipChange}
                            checked={this.state.us_citizen === true}
                        />
                        <Translate content="settings.yes" />
                    </label>
                    <label
                        htmlFor="us_citizen_no"
                        style={{display: "inline-block"}}
                    >
                        <input
                            name="us_citizen"
                            id="us_citizen_no"
                            type="radio"
                            value="false"
                            onChange={this.onCitizenshipChange}
                            checked={this.state.us_citizen === false}
                        />
                        <Translate content="settings.no" />
                    </label>
                </section>

                {/* If this is not the first account, show dropdown for fee payment account */}
                {firstAccount ? null : (
                    <div className="full-width-content form-group no-overflow">
                        <label>
                            <Translate content="account.pay_from" />
                        </label>
                        <AccountSelect
                            account_names={my_accounts}
                            onChange={this.onRegistrarAccountChange.bind(this)}
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

                <div
                    className="confirm-checks"
                    style={{paddingBottom: "1.5rem"}}
                    onClick={e => {
                        e.preventDefault();
                        this.setState({
                            understand_tos: !this.state.understand_tos
                        });
                    }}
                >
                    <label
                        htmlFor="checkbox-tos"
                        style={{position: "relative"}}
                        onClick={e => {
                            e.preventDefault();
                            this.setState({
                                understand_tos: !this.state.understand_tos
                            });
                        }}
                    >
                        <input
                            type="checkbox"
                            id="checkbox-tos"
                            onChange={() => {}}
                            checked={this.state.understand_tos}
                            style={{
                                pointerEvents: "none",
                                position: "absolute"
                            }}
                        />
                        <div style={{paddingLeft: "30px"}}>
                            <Translate
                                content="cryptobridge.account.terms_and_conditions_accept"
                                with={{
                                    cryptobridge_terms_and_conditions: (
                                        <a
                                            href={
                                                this.props.terms
                                                    ? this.props.terms.link
                                                    : "https://crypto-bridge.org/terms-and-conditions"
                                            }
                                            target={"_blank"}
                                            onClick={
                                                this.onTermsAndConditionsClick
                                            }
                                        >
                                            <Translate content="cryptobridge.account.terms_and_conditions" />
                                        </a>
                                    )
                                }}
                            />
                        </div>
                    </label>
                </div>

                <div
                    className="confirm-checks"
                    style={{paddingBottom: "1.5rem"}}
                    onClick={e => {
                        e.preventDefault();
                        this.setState({
                            understand_tos_disclaimer: !this.state
                                .understand_tos_disclaimer
                        });
                    }}
                >
                    <label
                        htmlFor="checkbox-tos"
                        style={{position: "relative"}}
                        onClick={e => {
                            e.preventDefault();
                            this.setState({
                                understand_tos_disclaimer: !this.state
                                    .understand_tos_disclaimer
                            });
                        }}
                    >
                        <input
                            type="checkbox"
                            id="checkbox-tos"
                            onChange={() => {}}
                            checked={this.state.understand_tos_disclaimer}
                            style={{
                                pointerEvents: "none",
                                position: "absolute"
                            }}
                        />
                        <div style={{paddingLeft: "30px"}}>
                            <Translate content="cryptobridge.account.terms_and_conditions_accept_disclaimer" />
                        </div>
                    </label>
                </div>

                <div className="divider" />

                <ReCAPTCHA
                    onChange={this.onRecaptchaChange}
                    payload={{user: this.state.accountName}}
                />

                {/* Submit button */}
                {this.state.loading ? (
                    <LoadingIndicator type="three-bounce" />
                ) : (
                    <button style={{width: "100%"}} className={buttonClass}>
                        <Translate content="account.create_account" />
                    </button>
                )}

                {/* Backup restore option */}
                <div style={{paddingTop: 40}}>
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
                </div>

                {/* Skip to step 3 */}
                {!hasWallet || firstAccount ? null : (
                    <div style={{paddingTop: 20}}>
                        <label>
                            <a
                                onClick={() => {
                                    this.setState({step: 3});
                                }}
                            >
                                <Translate content="wallet.go_get_started" />
                            </a>
                        </label>
                    </div>
                )}
            </form>
        );
    }

    _renderAccountCreateText() {
        let hasWallet = WalletDb.getWallet();
        let my_accounts = AccountStore.getMyAccounts();
        let firstAccount = my_accounts.length === 0;

        return (
            <div className="confirm-checks">
                <h4
                    style={{
                        fontWeight: "normal",
                        fontFamily: "Roboto-Medium, arial, sans-serif",
                        fontStyle: "normal",
                        paddingBottom: 15,
                        marginTop: 0
                    }}
                >
                    <Translate content="wallet.wallet_browser" />
                </h4>

                <p>
                    {!hasWallet ? (
                        <Translate content="wallet.has_wallet" />
                    ) : null}
                </p>

                <Translate
                    style={{textAlign: "left"}}
                    component="p"
                    content="wallet.create_account_text"
                />

                {firstAccount ? (
                    <Translate
                        style={{textAlign: "left"}}
                        component="p"
                        content="wallet.first_account_paid"
                    />
                ) : (
                    <Translate
                        style={{textAlign: "left"}}
                        component="p"
                        content="wallet.not_first_account"
                    />
                )}

                {/* {this.state.hide_refcode ? null :
                    <div>
                        <RefcodeInput ref="refcode" label="refcode.refcode_optional" expandable={true}/>
                        <br/>
                    </div>
                } */}
            </div>
        );
    }

    _renderBackup() {
        return (
            <div className="backup-submit">
                <p>
                    <Translate unsafe content="wallet.wallet_crucial" />
                </p>
                <div className="divider" />
                <BackupCreate noText downloadCb={this._onBackupDownload} />
            </div>
        );
    }

    _onBackupDownload = () => {
        this.setState({
            step: 3
        });
    };

    _renderBackupText() {
        return (
            <div>
                <p
                    style={{
                        fontWeight: "normal",
                        fontFamily: "Roboto-Medium, arial, sans-serif",
                        fontStyle: "normal"
                    }}
                >
                    <Translate content="footer.backup" />
                </p>
                <p>
                    <Translate content="wallet.wallet_move" unsafe />
                </p>
                <p className="txtlabel warning">
                    <Translate unsafe content="wallet.wallet_lose_warning" />
                </p>
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
                    <Translate content="wallet.tips_explore" />
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

    onRecaptchaChange = token => {
        this.setState({recaptchaToken: token});
    };

    render() {
        let {step} = this.state;

        return (
            <div className="sub-content">
                <div style={{maxWidth: "95vw"}}>
                    {step !== 1 ? (
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

                    {step === 1
                        ? this._renderAccountCreateForm()
                        : step === 2
                            ? this._renderBackup()
                            : this._renderGetStarted()}
                </div>

                <div style={{maxWidth: "95vw", paddingTop: "2rem"}}>
                    {step === 1
                        ? this._renderAccountCreateText()
                        : step === 2
                            ? this._renderBackupText()
                            : this._renderGetStartedText()}
                </div>
                <Link to="/">
                    <button className="button primary hollow">
                        <Translate content="wallet.back" />
                    </button>
                </Link>
            </div>
        );
    }
}

CreateAccount = withRouter(CreateAccount);

export default connect(CreateAccount, {
    listenTo() {
        return [AccountStore, CryptoBridgeStore];
    },
    getProps() {
        return {
            terms: CryptoBridgeStore.getLatestTerms()
        };
    }
});
