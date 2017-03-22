import React from "react";
import PasswordInput from "./../Forms/PasswordInput";
import WalletDb from "stores/WalletDb";
import Translate from "react-translate-component";

export default class AccountPermissionsMigrate extends React.Component {

    constructor() {
        super();

        this.state = {
            validPassword : false,
            pass: null
        };
    }

    onSubmit() {

    }

    onPasswordChange(e) {
        let {valid} = e;
        let name = this.props.account.get("name");

        const active = !valid ? null : WalletDb.generateKeyFromPassword(name, "active", e.value).pubKey;
        const owner = !valid ? null : WalletDb.generateKeyFromPassword(name, "owner", e.value).pubKey;
        const memo = !valid ? null : WalletDb.generateKeyFromPassword(name, "memo", e.value).pubKey;
        this.setState({validPassword: e.valid, pass: e.value});
        this.props.onSetPasswordKeys({active, owner, memo});
    }

    checkKeyUse(key, role) {
        if (!key) return false;
        if (role === "memo") {
            return key === this.props.memoKey;
        } else {
            return this.props[`${role}Keys`].reduce((a, b) => {
                return b === key || a;
            }, false);
        }
    }

    _onUseKey(role, remove = false) {
        if (remove) {
            this.props[role === "active" ? "onRemoveActive" : "onRemoveOwner"](this.props[role], "_keys");
        } else if (this.props[role]) {
            const weights = {
                active: this.props.account.getIn(["active", "weight_threshold"]),
                owner: this.props.account.getIn(["owner", "weight_threshold"])
            };
            this.props[role === "active" ? "onAddActive" : role === "owner" ? "onAddOwner" : "onSetMemo"](this.props[role], weights[role]);
        }
    }

    render() {
        let activeInUse = this.checkKeyUse(this.props.active && this.props.active, "active");
        let ownerInUse = this.checkKeyUse(this.props.owner && this.props.owner, "owner");
        let memoInUse = this.checkKeyUse(this.props.memo && this.props.memo, "memo");

        return (
                <div>
                    <p style={{maxWidth: "800px"}}><Translate content="account.perm.password_model_1" /></p>

                    <p style={{maxWidth: "800px"}}><Translate content="wallet.password_model_1" /></p>
                    <p style={{maxWidth: "800px"}}><Translate unsafe content="wallet.password_model_2" /></p>

                    <div className="divider" />

                    <form
                        style={{maxWidth: "40rem"}}
                        onSubmit={this.onSubmit.bind(this)}
                        noValidate
                    >
                        <p style={{fontWeight: "bold"}}><Translate content="account.perm.password_model_2" /></p>

                        <PasswordInput
                            ref="password"
                            confirmation={true}
                            onChange={this.onPasswordChange.bind(this)}
                            noLabel
                            passwordLength={12}
                        />
                    </form>

                    <table className="table">
                        <tbody>
                            <tr className={activeInUse ? "in-use" : ""}>
                                <td><Translate content="account.perm.new_active" />:</td>
                                <td>{this.props.active}</td>
                                <td className="text-right">
                                    <div className="button" onClick={this._onUseKey.bind(this, "active", activeInUse)}>{activeInUse ? "Remove" : "Use"}</div>
                                </td>
                            </tr>
                            <tr className={ownerInUse ? "in-use" : ""}>
                                <td><Translate content="account.perm.new_owner" />:</td>
                                <td>{this.props.owner}</td>
                                <td className="text-right"><div className="button" onClick={this._onUseKey.bind(this, "owner", ownerInUse)}>{ownerInUse ? "Remove" : "Use"}</div></td>
                            </tr>
                            <tr className={memoInUse ? "in-use" : ""}>
                                <td><Translate content="account.perm.new_memo" />:</td>
                                <td>{this.props.memo}</td>
                                <td className="text-right">
                                    <div className="button" style={{visibility: memoInUse ? "hidden" : ""}} onClick={this._onUseKey.bind(this, "memo", memoInUse)}>Use</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {memoInUse ? <p style={{maxWidth: "800px", paddingTop: 10}} className="has-error">WARNING: If you replace the memo key you will be unable to read old memos when logging in with your password, and unless you import the new memo private key into your old wallet that wallet will be unable to decode new memos.</p> : null}


                </div>
        );
    }
}
