import React, {Component} from "react";
import WalletStore from "stores/WalletStore";
import WalletActions from "actions/WalletActions"
import WalletImport from "./WalletImport"

import key from "common/key_utils"

export default class WalletCreate extends Component {
    
    constructor() {
        super()
        this.state = { 
            wallet_public_name: "default",
            brainkey: key.suggest_brain_key(key.browserEntropy()),
            password: "",
            password_confirm: "",
            private_wifs: []
        };
        //this._bind("handleSubmit")
    }
    
    //life cycle...
    //    React.findDOMNode(this.refs.nameInput).focus();
    
    render() {
        return <div className="grid-block vertical">
            <form className="name-form"
                onSubmit={this.create.bind(this)}
            >
                <label>
                    NAME
                    <input type="text" id="name" ref="nameInput"
                        value={this.state.wallet_public_name}
                        onChange={this._nameChanged.bind(this)} />
                </label>
                <label>
                    PASSWORD
                    <input type="password" value={this.state.password}
                        onChange={this._passwordChanged.bind(this)} />
                </label>
                <label>
                    PASSWORD (confirm):
                    <input type="password" value={this.state.password_confirm}
                        onChange={this._passwordConfirmChanged.bind(this)} />
                </label>
                <label>
                    BRAIN-KEY
                    <textarea type="text" value={this.state.brainkey}
                        onChange={this._brainkeyChanged.bind(this)} />
                </label>
                <label>IMPORT PRIVATE KEYS (optional)</label>
                <WalletImport private_wifs={this.state.private_wifs}/>
                <br/>
                <input type="submit" className="button" value={"Save"} />
            </form>
        </div>
    }
    
    _nameChanged(e) { this.setState({wallet_public_name: e.target.value }) }
    _passwordChanged(e) { this.setState({password: e.target.value }) }
    _passwordConfirmChanged(e) { this.setState({password_confirm: e.target.value }) }
    _brainkeyChanged(e) { this.setState({brainkey: e.target.value }) }
    
    create(e) {
        e.preventDefault()
        if(this.state.password === this.state.password_confirm) {
            console.log('... WalletActions',WalletActions)
            WalletActions.create(
                this.state.wallet_public_name,
                this.state.password,
                this.state.brainkey,
                this.state.private_wifs
            )
        }
    }
}
