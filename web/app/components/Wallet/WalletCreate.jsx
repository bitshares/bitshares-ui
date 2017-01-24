import React, {Component} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import BrainkeyInput from "components/Wallet/BrainkeyInput";
import PasswordConfirm from "components/Wallet/PasswordConfirm";
import WalletDb from "stores/WalletDb";
import WalletManagerStore from "stores/WalletManagerStore";
import WalletActions from "actions/WalletActions";
import { connect } from "alt-react";
import cname from "classnames";

class CreateNewWallet extends Component {

    static propTypes = {
        hideTitle: React.PropTypes.bool
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
        this.state.valid_password = valid_password;
        this.setState({ valid_password }, this.validate);
    }

    onCustomBrainkey() {
        this.setState({ custom_brainkey: true });
    }

    onBrainkey(brnkey) {
        this.state.brnkey = brnkey;
        this.setState({ brnkey }, this.validate);
    }

    onSubmit(e) {
        e.preventDefault();

        let {wallet_public_name, valid_password, custom_brainkey, errors} = this.state;
        if (!valid_password || errors.wallet_public_name || (custom_brainkey && !errors.validBrainkey)) {
            return;
        }

        WalletActions.setWallet(wallet_public_name, valid_password, this.state.brnkey);
        this.setState({create_submitted: true});
    }

    formChange(event) {
        let key_id = event.target.id;
        let value = event.target.value;
        if(key_id === "wallet_public_name") {
            //case in-sensitive
            value = value.toLowerCase();
            // Allow only valid file name characters
            if( /[^a-z0-9_-]/.test(value) ) return;
        }

        // Set state is updated directly because validate is going to
        // require a merge of new and old state
        this.state[key_id] = value;
        this.setState(this.state);
        this.validate();
    }

    validate(state = this.state) {
        let errors = state.errors;
        let {wallet_names} = this.props;
        errors.wallet_public_name =
            !wallet_names.has(state.wallet_public_name) ?
            null : `Wallet ${state.wallet_public_name.toUpperCase()} exists, please change the name`;

        var isValid = errors.wallet_public_name === null && state.valid_password !== null;
        if(state.custom_brainkey && isValid)
            isValid = state.brnkey !== null;
        this.setState({ isValid, errors });
    }
    //
    // onDone() {
    //     window.history.back();
    // }

    render() {
        let state = this.state;
        let errors = state.errors;
        let has_wallet = !!this.props.current_wallet;

        if(this.state.create_submitted &&
            this.state.wallet_public_name === this.props.current_wallet) {
            return <div>
                <h4><Translate content="wallet.wallet_created" /></h4>
                <Link to="dashboard">
                    <div className="button success"><Translate content="wallet.done" /></div>
                </Link>
            </div>;
        }

        return (
            <div>

            <form
                style={{maxWidth: "40rem"}}
                onSubmit={this.onSubmit.bind(this)}
                onChange={this.formChange.bind(this)} noValidate
            >

                <div
                    className="grid-content"
                    style={{
                        textAlign: "left"
                    }}
                >
                    {!this.props.restoreBrainkey ? <Translate component="p" content="wallet.create_importkeys_text" /> : null}
                    {!this.props.restoreBrainkey ? <Translate component="p" content="wallet.create_text" /> : null}
                </div>
                <PasswordConfirm onValid={this.onPassword.bind(this)}/>
                { has_wallet ? (
                    <div className="no-overflow">
                        <br/>
                        <section>
                        <label><Translate content="wallet.name" /></label>
                        <input
                            tabIndex={3}
                            type="text"
                            id="wallet_public_name"
                            defaultValue={this.state.wallet_public_name}
                        />
                        </section>
                        <div className="has-error">{errors.wallet_public_name}</div>
                        <br/>
                    </div>) : null}

                <div className="no-overflow">

                    { this.state.custom_brainkey ? (
                    <div>
                        <label><Translate content="wallet.brainkey" /></label>
                        <BrainkeyInput tabIndex={4} onChange={this.onBrainkey.bind(this)} errorCallback={(warn) => {
                            let {errors} = this.state;
                            errors.validBrainkey = warn;
                            this.setState({
                                errors
                            });
                        }}/>
                    </div>) : null}

                    <button className={cname("button",{disabled: !(this.state.isValid)})}>
                        <Translate content="wallet.create_wallet" />
                    </button>

                    <button className="button secondary" onClick={this.onBack.bind(this)}>
                        <Translate content="wallet.cancel" />
                    </button>

                </div>

                { ! this.state.custom_brainkey ? (
                <div style={{paddingTop: 20}}>
                    <label>
                        <a onClick={this.onCustomBrainkey.bind(this)}>
                        <Translate content="wallet.custom_brainkey" /></a>
                    </label>
                </div>) : null}
            </form>
        </div>);
    }
}

CreateNewWallet = connect(CreateNewWallet, {
    listenTo() {
        return [WalletManagerStore];
    },
    getProps() {
        return WalletManagerStore.getState();
    }
});

class WalletCreate extends Component {
    render() {
        if(WalletDb.getWallet() && this.props.children) return <div>{this.props.children}</div>;

        return <CreateNewWallet {...this.props}/>;
    }
}

const CreateWalletFromBrainkey = (props) => {
    if (!props.nested) {
        return (
            <div className="grid-container" style={{paddingTop: 30}}>
                <Translate content="settings.backup_brainkey" component="h3" />
                <Translate content="settings.restore_brainkey_text" component="p" style={{maxWidth: "40rem", paddingBottom: 10}} />
                <WalletCreate restoreBrainkey {...props} />
            </div>
        );
    }
    return <WalletCreate restoreBrainkey {...props} />;
};

export { WalletCreate, CreateWalletFromBrainkey };
