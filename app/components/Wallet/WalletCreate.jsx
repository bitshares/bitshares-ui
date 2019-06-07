import React, {Component, Fragment} from "react";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import BrainkeyInput from "components/Wallet/BrainkeyInputStyleGuide";
import PasswordConfirm from "components/Wallet/PasswordConfirmStyleGuide";
import WalletDb from "stores/WalletDb";
import WalletManagerStore from "stores/WalletManagerStore";
import WalletActions from "actions/WalletActions";
import {connect} from "alt-react";
import SettingsActions from "actions/SettingsActions";
import PropTypes from "prop-types";
import {getWalletName} from "branding";
import {Button, Form, Input} from "bitshares-ui-style-guide";
import counterpart from "counterpart";

class CreateNewWallet extends Component {
    static propTypes = {
        hideTitle: PropTypes.bool
    };

    constructor(props) {
        super();

        this.state = {
            wallet_public_name: "default",
            valid_password: null,
            errors: {
                validBrainkey: false
            },
            isValid: false,
            create_submitted: false,
            custom_brainkey: props.restoreBrainkey || false,
            brnkey: null
        };

        this.validate = this.validate.bind(this);
    }

    onBack(e) {
        e.preventDefault();
        window.history.back();
    }

    onPassword(valid_password) {
        if (valid_password !== this.state.valid_password)
            this.setState({valid_password}, this.validate);
    }

    onCustomBrainkey() {
        this.setState({custom_brainkey: true});
    }

    onBrainkey(brnkey) {
        this.setState({brnkey}, this.validate);
    }

    onSubmit = e => {
        e.preventDefault();

        let {
            wallet_public_name,
            valid_password,
            custom_brainkey,
            errors
        } = this.state;
        if (
            !valid_password ||
            errors.wallet_public_name ||
            (custom_brainkey && !errors.validBrainkey)
        ) {
            return;
        }

        WalletActions.setWallet(
            wallet_public_name,
            valid_password,
            this.state.brnkey
        );
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: false
        });
        this.setState({create_submitted: true});
    };

    formChange = event => {
        let key_id = event.target.id;
        let value = event.target.value;
        if (key_id === "wallet_public_name") {
            //case in-sensitive
            value = value.toLowerCase();
            // Allow only valid file name characters
            if (/[^a-z0-9_-]/.test(value)) return;
        }

        // Set state is updated directly because validate is going to
        // require a merge of new and old state
        this.state[key_id] = value;
        this.setState(this.state);
        this.validate();
    };

    validate(state = this.state) {
        let errors = state.errors;
        let {wallet_names} = this.props;
        errors.wallet_public_name = !wallet_names.has(state.wallet_public_name)
            ? null
            : `Wallet ${state.wallet_public_name.toUpperCase()} exists, please change the name`;

        let isValid =
            errors.wallet_public_name === null && state.valid_password !== null;
        if (state.custom_brainkey && isValid) isValid = state.brnkey !== null;
        this.setState({isValid, errors});
    }

    render() {
        let state = this.state;
        let errors = state.errors;
        let has_wallet = !!this.props.current_wallet;

        if (
            this.state.create_submitted &&
            this.state.wallet_public_name === this.props.current_wallet
        ) {
            return (
                <div>
                    <h4>
                        <Translate content="wallet.wallet_created" />
                    </h4>
                    <Link to="/">
                        <div className="button success">
                            <Translate content="wallet.done" />
                        </div>
                    </Link>
                </div>
            );
        }

        return (
            <div className="wallet-create">
                <Form
                    style={{maxWidth: "40rem"}}
                    onSubmit={this.onSubmit}
                    onChange={this.formChange}
                    noValidate
                >
                    <div
                        className="grid-content"
                        style={{
                            textAlign: "left"
                        }}
                    >
                        {!this.props.restoreBrainkey ? (
                            <Fragment>
                                <Translate
                                    component="p"
                                    content="wallet.create_importkeys_text"
                                />
                                <Translate
                                    component="p"
                                    content="wallet.create_text"
                                    wallet_name={getWalletName()}
                                />
                            </Fragment>
                        ) : null}
                    </div>
                    <PasswordConfirm onValid={this.onPassword.bind(this)} />
                    {has_wallet ? (
                        <Form.Item label={counterpart.translate("wallet.name")}>
                            <div className="no-overflow">
                                <section>
                                    <Input
                                        tabIndex={3}
                                        type="text"
                                        id="wallet_public_name"
                                        defaultValue={
                                            this.state.wallet_public_name
                                        }
                                    />
                                    <div className="has-error">
                                        {errors.wallet_public_name}
                                    </div>
                                </section>
                            </div>
                        </Form.Item>
                    ) : null}

                    <div className="no-overflow">
                        {this.state.custom_brainkey ? (
                            <div>
                                <Form.Item
                                    label={counterpart.translate(
                                        "wallet.brainkey"
                                    )}
                                >
                                    <BrainkeyInput
                                        tabIndex={4}
                                        onChange={this.onBrainkey.bind(this)}
                                        errorCallback={warn => {
                                            let {errors} = this.state;
                                            errors.validBrainkey = warn;
                                            this.setState({
                                                errors
                                            });
                                        }}
                                    />
                                </Form.Item>
                            </div>
                        ) : null}

                        <Button
                            type="primary"
                            htmlType="submit"
                            disabled={!this.state.isValid}
                        >
                            <Translate content="wallet.create_wallet" />
                        </Button>

                        <Button onClick={this.onBack.bind(this)}>
                            <Translate content="wallet.cancel" />
                        </Button>
                    </div>

                    {!this.state.custom_brainkey ? (
                        <div style={{paddingTop: 20}}>
                            <label>
                                <a onClick={this.onCustomBrainkey.bind(this)}>
                                    <Translate content="wallet.custom_brainkey" />
                                </a>
                            </label>
                        </div>
                    ) : null}
                </Form>
            </div>
        );
    }
}

CreateNewWallet = connect(
    CreateNewWallet,
    {
        listenTo() {
            return [WalletManagerStore];
        },
        getProps() {
            return WalletManagerStore.getState();
        }
    }
);

class WalletCreate extends Component {
    render() {
        if (WalletDb.getWallet() && this.props.children)
            return <div>{this.props.children}</div>;

        return <CreateNewWallet {...this.props} />;
    }
}

const CreateWalletFromBrainkey = props => {
    const wallet_types = (
        <Link to="/help/introduction/wallets">
            {counterpart.translate("wallet.wallet_types")}
        </Link>
    );
    const backup_types = (
        <Link to="/help/introduction/backups">
            {counterpart.translate("wallet.backup_types")}
        </Link>
    );

    if (!props.nested) {
        return (
            <div className="grid-container" style={{paddingTop: 30}}>
                <Translate content="settings.backup_brainkey" component="h3" />
                <Translate
                    content="settings.restore_brainkey_text"
                    component="p"
                    style={{maxWidth: "40rem"}}
                />
                <Translate
                    component="p"
                    style={{paddingBottom: 10}}
                    wallet={wallet_types}
                    backup={backup_types}
                    content="wallet.read_more"
                />
                <WalletCreate restoreBrainkey {...props} />
            </div>
        );
    }
    return <WalletCreate restoreBrainkey {...props} />;
};

export {WalletCreate, CreateWalletFromBrainkey};
