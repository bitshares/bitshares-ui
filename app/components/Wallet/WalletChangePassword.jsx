import React, {Component} from "react";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import WalletDb from "stores/WalletDb";
import PasswordConfirm from "./PasswordConfirm";
import counterpart from "counterpart";
import PropTypes from "prop-types";
import {Button, Form, Input, Notification} from "bitshares-ui-style-guide";

const FormItem = Form.Item;

export default class WalletChangePassword extends Component {
    constructor() {
        super();
        this.state = {success: false};
    }

    onAccept(e) {
        e.preventDefault();
        var {old_password, new_password} = this.state;
        WalletDb.changePassword(old_password, new_password, true /*unlock*/)
            .then(() => {
                Notification.success({
                    message: counterpart.translate(
                        "notifications.password_change_success"
                    )
                });
                this.setState({success: true});
                // window.history.back();
            })
            .catch(error => {
                // Programmer or database error ( validation missed something? )
                // .. translation may be unnecessary
                console.error(error);
                Notification.error({
                    message: counterpart.translate(
                        "notifications.password_change_failure",
                        {
                            error_msg: error
                        }
                    )
                });
            });
    }

    onOldPassword(old_password) {
        this.setState({old_password});
    }
    onNewPassword(new_password) {
        this.setState({new_password});
    }

    _onCancel() {
        this.setState({
            old_password: ""
        });

        this.refs.pwd.cancel();
    }

    render() {
        var ready = !!this.state.new_password;
        let {success} = this.state;

        if (success) {
            return (
                <div>
                    <Translate component="p" content="wallet.change_success" />
                    <Translate component="p" content="wallet.change_backup" />
                    <Link to="/wallet/backup/create">
                        <Button>
                            <Translate content="wallet.create_backup" />
                        </Button>
                    </Link>
                </div>
            );
        }

        return (
            <span>
                <WalletPassword
                    ref="pwd"
                    onValid={this.onOldPassword.bind(this)}
                >
                    <PasswordConfirm
                        onSubmit={this.onAccept.bind(this)}
                        newPassword={true}
                        onValid={this.onNewPassword.bind(this)}
                    >
                        <Button
                            type="primary"
                            disabled={!ready}
                            htmlType="submit"
                            style={{marginRight: "16px"}}
                            onClick={this.onAccept.bind(this)}
                        >
                            <Translate content="wallet.accept" />
                        </Button>
                        <Button onClick={this._onCancel.bind(this)}>
                            <Translate content="wallet.cancel" />
                        </Button>
                    </PasswordConfirm>
                </WalletPassword>
            </span>
        );
    }
}

class WalletPassword extends Component {
    static propTypes = {
        onValid: PropTypes.func.isRequired
    };

    constructor() {
        super();
        this.state = {
            password: "",
            verified: false
        };
    }

    cancel() {
        this.setState({
            verified: false,
            password: ""
        });
    }

    onPassword(e) {
        e.preventDefault();
        let {success} = WalletDb.validatePassword(this.state.password, true);
        if (success) {
            this.setState({verified: true});
            this.props.onValid(this.state.password);
        } else {
            Notification.error({
                message: counterpart.translate("notifications.invalid_password")
            });
        }
    }

    formChange(event) {
        var state = {};
        state[event.target.id] = event.target.value;
        this.setState(state);
    }

    render() {
        if (this.state.verified) {
            return <div className="grid-content">{this.props.children}</div>;
        } else {
            return (
                <Form onSubmit={this.onPassword.bind(this)}>
                    <FormItem
                        label={counterpart.translate(
                            "wallet.existing_password"
                        )}
                    >
                        <section>
                            <Input
                                placeholder={counterpart.translate(
                                    "wallet.current_pass"
                                )}
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                onChange={this.formChange.bind(this)}
                                value={this.state.password}
                            />
                        </section>
                        <Button
                            type="primary"
                            onClick={this.onPassword.bind(this)}
                            style={{marginTop: 10}}
                        >
                            <Translate content="wallet.submit" />
                        </Button>
                    </FormItem>
                </Form>
            );
        }
    }
}

class Reset extends Component {
    render() {
        var label = this.props.label || <Translate content="wallet.reset" />;
        return (
            <span className="button outline" onClick={this.onReset.bind(this)}>
                {label}
            </span>
        );
    }

    onReset() {
        window.history.back();
    }
}
