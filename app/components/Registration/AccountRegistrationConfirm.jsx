import React from "react";
import PropTypes from "prop-types";
import {connect} from "alt-react";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import WalletDb from "stores/WalletDb";
import counterpart from "counterpart";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import Translate from "react-translate-component";
import {FetchChain} from "tuscjs/es";
import WalletUnlockActions from "actions/WalletUnlockActions";
import Icon from "components/Icon/Icon";
import {
    Notification,
    Button,
    Input,
    Checkbox,
    Form,
    Alert
} from "bitshares-ui-style-guide";
import CopyButton from "../Utility/CopyButton";

class AccountRegistrationConfirm extends React.Component {
    static propTypes = {
        accountName: PropTypes.string.isRequired,
        password: PropTypes.string.isRequired,
        toggleConfirmed: PropTypes.func.isRequired,
        history: PropTypes.object.isRequired
    };

    constructor() {
        super();
        this.state = {
            confirmed: false
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);
        this.toggleConfirmed = this.toggleConfirmed.bind(this);
        this.createAccount = this.createAccount.bind(this);
        this.onCreateAccount = this.onCreateAccount.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.confirmed !== this.state.confirmed;
    }

    onFinishConfirm(confirmStoreState) {
        if (
            confirmStoreState.included &&
            confirmStoreState.broadcasted_transaction
        ) {
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();

            FetchChain("getAccount", this.state.accountName).then(() => {
                this.props.history.push(
                    "/wallet/backup/create?newAccount=true"
                );
            });
        }
    }

    onCreateAccount(e) {
        e.preventDefault();
        this.createAccount(this.props.accountName, this.props.password);
    }

    createAccount(name, password) {
        const {referralAccount} = AccountStore.getState();

        AccountActions.createAccountWithPassword(
            name,
            password,
            this.state.registrarAccount,
            referralAccount || this.state.registrarAccount,
            0
        )
            .then(() => {
                AccountActions.setPasswordAccount(name);
                if (this.state.registrarAccount) {
                    FetchChain("getAccount", name).then(() => {
                        this.unlockAccount(name, password);
                    });
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else {
                    FetchChain("getAccount", name).then(() => {});
                    this.unlockAccount(name, password);
                    this.props.history.push("/");
                }
            })
            .catch(error => {
                console.log("ERROR AccountActions.createAccount", error);
                let errorMsg =
                    error.base && error.base.length && error.base.length > 0
                        ? error.base[0]
                        : "unknown error";
                if (error.remote_ip) {
                    [errorMsg] = error.remote_ip;
                }
                Notification.error({
                    message: counterpart.translate("account_create_failure", {
                        account_name: name,
                        error_msg: errorMsg
                    })
                });
            });
    }

    unlockAccount(name, password) {
        WalletDb.validatePassword(password, true, name);
        WalletUnlockActions.checkLock.defer();
    }

    toggleConfirmed(e) {
        this.setState({
            confirmed: e.target.checked
        });
    }

    render() {
        return (
            <Form layout={"vertical"}>
                <Form.Item
                    label={counterpart.translate("registration.copyPassword")}
                >
                    <Input.TextArea
                        disabled={true}
                        rows={2}
                        id="password"
                        value={this.props.password}
                    />
                    <CopyButton
                        text={this.state.generatedPassword}
                        tip="tooltip.copy_password"
                        dataPlace="top"
                        className="button registration-layout--copy-password-btn"
                    />
                </Form.Item>

                <Form.Item>
                    <Alert
                        showIcon
                        type={"warning"}
                        message={""}
                        description={counterpart.translate(
                            "registration.accountNote"
                        )}
                    />
                </Form.Item>

                <Form.Item>
                    <Checkbox
                        checked={this.state.confirmed}
                        onChange={this.toggleConfirmed}
                    >
                        <Translate
                            content="registration.accountConfirmation"
                            className="checkbox-text"
                        />
                    </Checkbox>
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        disabled={!this.state.confirmed}
                        onClick={this.onCreateAccount}
                    >
                        <Translate content="account.create_account" />
                    </Button>
                </Form.Item>
            </Form>
        );
    }
}

export default connect(
    AccountRegistrationConfirm,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {};
        }
    }
);
