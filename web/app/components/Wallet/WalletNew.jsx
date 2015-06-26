import React, {Component} from "react";
import BaseComponent from "../BaseComponent";
import WalletStore from "stores/WalletStore";
import WalletActions from "actions/WalletActions"
import key from "common/key_utils"

class WalletNew extends Component {
    
    constructor() {
        super()
        this.state = { 
            wallet_public_name: "default",
            brainkey: key.suggest_brain_key(key.browserEntropy()),
            password: ""
        };
        //this._bind("handleSubmit")
    }
    
    render() {
        return <div className="grid-block vertical">
            <form className="name-form"
                onSubmit={this.create.bind(this)}
            >
                <label>
                    Name:
                    <input type="text" id="name" autofocus
                        value={this.state.wallet_public_name}
                        onChange={this._nameChanged.bind(this)} />
                </label>
                <label>
                    Password:
                    <input type="password" value={this.state.password}
                        onChange={this._passwordChanged.bind(this)} />
                </label>
                <label>
                    BrainKey:
                    <input type="text" value={this.state.brainkey}
                        onChange={this._brainkeyChanged.bind(this)} />
                </label>
                <input type="submit" className="button" value={"Save"} />
            </form>
        </div>
    }
    
    _nameChanged(e) { this.setState({wallet_public_name: e.target.value }) }
    _passwordChanged(e) { this.setState({password: e.target.value }) }
    _brainkeyChanged(e) { this.setState({brainkey: e.target.value }) }
    
    create() {
        WalletStore.create(
            this.state.wallet_public_name,
            this.state.password,
            this.state.brainkey
        )
    }
}


export default WalletNew;
