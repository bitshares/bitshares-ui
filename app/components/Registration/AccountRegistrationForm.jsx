import React from "react";
import PropTypes from "prop-types";
import {connect} from "alt-react";
import AccountStore from "stores/AccountStore";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {ChainStore, key} from "tuscjs/es";
import ReactTooltip from "react-tooltip";
import utils from "common/utils";
import SettingsActions from "actions/SettingsActions";
import WalletDb from "stores/WalletDb";
import AccountNameInput from "./../Forms/AccountNameInputStyleGuide";
import AccountSelect from "../Forms/AccountSelect";
import LoadingIndicator from "../LoadingIndicator";
import Icon from "../Icon/Icon";
import CopyButton from "../Utility/CopyButton";
import {Form, Input, Button, Tooltip} from "bitshares-ui-style-guide";

class AccountRegistrationForm extends React.Component {
    static propTypes = {
        continue: PropTypes.func.isRequired
    };

    constructor() {
        super();
        this.state = {
            validAccountName: false,
            accountName: "",
            registrarAccount: null,
            loading: false,
            generatedPassword: `P${key.get_random_key().toWif()}`,
            confirmPassword: ""
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.onRegistrarAccountChange = this.onRegistrarAccountChange.bind(
            this
        );
        this.onAccountNameChange = this.onAccountNameChange.bind(this);
        this.onConfirmation = this.onConfirmation.bind(this);
        this.accountNameInput = null;
    }

    componentWillMount() {
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: true
        });
    }

    componentDidMount() {
        ReactTooltip.rebuild();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !utils.are_equal_shallow(nextState, this.state);
    }

    onAccountNameChange(e) {
        const state = {};
        if (e.valid !== undefined) {
            state.validAccountName = e.valid;
        }
        if (e.value !== undefined) {
            state.accountName = e.value;
        }
        this.setState(state);
    }

    onRegistrarAccountChange(registrarAccount) {
        this.setState({registrarAccount});
    }

    onSubmit(e) {
        e.preventDefault();
        if (this.isValid()) {
            this.props.continue({
                accountName: this.state.accountName,
                password: this.state.generatedPassword
            });
        }
    }

    onConfirmation(e) {
        const value = e.currentTarget.value;
        this.setState({
            confirmPassword: value,
            passwordConfirmed: value === this.state.generatedPassword
        });
    }

    isValid() {
        const firstAccount = AccountStore.getMyAccounts().length === 0;
        let valid = this.state.validAccountName;
        if (!WalletDb.getWallet()) {
            valid = valid;
        }
        if (!firstAccount) {
            valid = valid && this.state.registrarAccount;
        }
        return valid;
    }

    renderAccountCreateForm() {
        const {registrarAccount} = this.state;

        const myAccounts = AccountStore.getMyAccounts();
        const firstAccount = myAccounts.length === 0;
        const valid = this.isValid();
        let isLTM = false;
        const registrar = registrarAccount
            ? ChainStore.getAccount(registrarAccount)
            : null;
        if (registrar) {
            if (registrar.get("lifetime_referrer") === registrar.get("id")) {
                isLTM = true;
            }
        }

        const getConfirmationPasswordHelp = () => {
            return this.state.confirmPassword && !this.state.passwordConfirmed
                ? counterpart.translate("wallet.confirm_error")
                : "";
        };

        const getConfirmationPasswordValidateStatus = () => {
            return this.state.confirmPassword && !this.state.passwordConfirmed
                ? "error"
                : "";
        };

        return (
            <div>
                <Form onSubmit={this.onSubmit} layout={"vertical"}>
                    <AccountNameInput
                        cheapNameOnly={firstAccount}
                        onChange={this.onAccountNameChange}
                        accountShouldNotExist
                        placeholder={counterpart.translate("account.name")}
                        label={
                            <span>
                                <span className="vertical-middle">
                                    {counterpart.translate("account.name")}
                                </span>
                                &nbsp;
                                <Tooltip
                                    title={counterpart.translate(
                                        "tooltip.registration.accountName"
                                    )}
                                >
                                    <span>
                                        <Icon
                                            name="question-in-circle"
                                            className="icon-14px question-icon vertical-middle"
                                        />
                                    </span>
                                </Tooltip>
                            </span>
                        }
                        noLabel
                    />
                    <Form.Item
                        label={counterpart.translate("wallet.generated")}
                    >
                        <Input.TextArea
                            disabled={true}
                            style={{paddingRight: "50px"}}
                            rows={2}
                            id="password"
                            value={this.state.generatedPassword}
                        />
                        <CopyButton
                            text={this.state.generatedPassword}
                            tip="tooltip.copy_password"
                            dataPlace="top"
                            className="button registration-layout--copy-password-btn"
                        />
                    </Form.Item>
                    {/*<span className="inline-label generated-password-field">*/}
                    {/*<textarea*/}
                    {/*id="password"*/}
                    {/*rows="2"*/}
                    {/*readOnly*/}
                    {/*disabled*/}
                    {/*defaultValue={this.state.generatedPassword}*/}
                    {/*/>*/}
                    {/*<CopyButton*/}
                    {/*text={this.state.generatedPassword}*/}
                    {/*tip="tooltip.copy_password"*/}
                    {/*dataPlace="top"*/}
                    {/*/>*/}
                    {/*</span>*/}
                    {/*<label className="left-label" htmlFor="confirmPassword">*/}
                    {/*<Translate content="wallet.confirm_password" />*/}
                    {/*</label>*/}
                    <Form.Item
                        label={counterpart.translate("wallet.confirm_password")}
                        help={getConfirmationPasswordHelp()}
                        validateStatus={getConfirmationPasswordValidateStatus()}
                    >
                        <Input
                            placeholder={counterpart.translate(
                                "wallet.confirm_password"
                            )}
                            type="password"
                            name="password"
                            id="confirmPassword"
                            value={this.state.confirmPassword}
                            onChange={this.onConfirmation}
                        />
                    </Form.Item>
                    {/*<span className="inline-label">*/}
                    {/*<input*/}
                    {/*type="password"*/}
                    {/*name="password"*/}
                    {/*id="confirmPassword"*/}
                    {/*value={this.state.confirmPassword}*/}
                    {/*onChange={this.onConfirmation}*/}
                    {/*/>*/}
                    {/*</span>*/}
                    {/*{this.state.confirmPassword &&*/}
                    {/*!this.state.passwordConfirmed ? (*/}
                    {/*<div className="has-error">*/}
                    {/*<Translate content="wallet.confirm_error" />*/}
                    {/*</div>*/}
                    {/*) : null}*/}

                    {firstAccount ? null : (
                        <div className="full-width-content form-group no-overflow">
                            <label htmlFor="account">
                                <Translate content="account.pay_from" />
                            </label>
                            <AccountSelect
                                id="account"
                                account_names={myAccounts}
                                onChange={this.onRegistrarAccountChange}
                            />
                            {registrarAccount && !isLTM ? (
                                <div
                                    style={{textAlign: "left"}}
                                    className="facolor-error"
                                >
                                    <Translate content="wallet.must_be_ltm" />
                                </div>
                            ) : null}
                        </div>
                    )}
                    {this.state.loading ? (
                        <LoadingIndicator type="three-bounce" />
                    ) : (
                        <Button
                            htmlType="submit"
                            type="primary"
                            disabled={
                                !valid ||
                                !this.state.passwordConfirmed ||
                                (registrarAccount && !isLTM)
                            }
                        >
                            <Translate content="registration.continue" />
                        </Button>
                    )}
                </Form>
            </div>
        );
    }

    renderAccountCreateText() {
        const myAccounts = AccountStore.getMyAccounts();
        const firstAccount = myAccounts.length === 0;

        return (
            <div>
                <Translate
                    component="p"
                    className="model-description"
                    content="registration.accountDescription"
                />

                {firstAccount ? null : (
                    <Translate
                        component="p"
                        content="wallet.not_first_account"
                    />
                )}
            </div>
        );
    }

    render() {
        return (
            <div>
                {this.renderAccountCreateText()}
                {this.renderAccountCreateForm()}
            </div>
        );
    }
}

export default connect(
    AccountRegistrationForm,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {};
        }
    }
);
