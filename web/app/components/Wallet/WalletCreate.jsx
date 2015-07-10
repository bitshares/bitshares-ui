import React, {Component} from "react";

import WalletDb from "stores/WalletDb";
import WalletImport from "./WalletImport";

import key from "common/key_utils";
// import forms from "newforms";
import cname from "classnames";

class WalletCreate extends Component {
    
    constructor() {
        super();
        this.state = { 
            wallet_public_name: "default",
            brainkey: key.suggest_brain_key(key.browserEntropy()),
            password: "",
            password_confirm: "",
            private_wifs: [],
            errors: {},
            isValid: false
        };
        this.validate();
    }
    
    render() {
        let state = this.state;
        let errors = state.errors;
        let submitDisabled = this.state.isValid ? "" : "disabled";
        
        return (
            <div className="grid-block page-layout">
                <div className="grid-block vertical medium-8 medium-offset-2">
                    <form 
                        className="name-form"
                        onSubmit={this.onSubmit.bind(this)}
                        onChange={this.formChange.bind(this)} noValidate
                    >
                        <div className={cname("grid-content", {"has-error": errors.from})}>
                            <label>Name</label>
                            <input type="text" id="wallet_public_name"
                                value={this.state.wallet_public_name} />
                            <div>{errors.wallet_public_name}</div>
                            <br/>
                        </div>
                        
                        <div className={cname("grid-content", "no-overflow", {
                            "has-error": errors.password_match 
                        })}>
                            <label>Password</label>
                            <input type="password" id="password"
                                value={this.state.password} />
                            
                            <label>Password (confirm)</label>
                                <input type="password" id="password_confirm"
                                    value={this.state.password_confirm}/>
                            <div>{errors.password_match}</div>
                            <br/>
                        </div>
                        
                        <div className="grid-content">
                            <label>Brain-Key</label>
                            <textarea type="text" id="brainkey"
                                value={this.state.brainkey} />
                            <br/>
                        </div>
                        
                        <div className="grid-content">
                            <WalletImport private_wifs={this.state.private_wifs}/>
                            <br/>
                        </div>
                        
                        <div className="grid-content">
                            <input type="submit" value={"Save"}
                                className={cname("button",{disabled:submitDisabled})}/>
                            <br/>
                        </div>                        
                    </form>
                </div>
            </div>
        );
    }
    
    validate() {
        let state = this.state;
        let errors = state.errors;
        let wallets = WalletDb.wallets;
        
        errors.wallet_public_name = 
            !wallets.get(state.wallet_public_name) ? 
            null : `Wallet ${state.wallet_public_name.toUpperCase()} exists, please change the name`
        
        errors.password_match = null
        errors.password_match =
            state.password === state.password_confirm ||
            //don't report it until the confirm is populated
            (state.password === "" || state.password_confirm === "")
        ? null :
            "Passwords do not match";
        
        let password_unmatch =
            state.password !== state.password_confirm;
        
        state.isValid = !(errors.wallet_public_name || password_unmatch);
    }
    
    formChange(event) {
        let key_id = event.target.id;
        let value = event.target.value;
        if(key_id === "wallet_public_name") {
            //case in-sensitive
            value = value.toLowerCase();
        }
        if(key_id === "brainkey") {
            value = value.toUpperCase();
            value = value.split(/[\t\n\v\f\r ]+/).join(" ");
        }
        
        this.state[key_id] = value;
        this.validate();
        this.setState(this.state);
    }
    
    onSubmit(e) {
        e.preventDefault();
        new Promise((resolve, reject) => {
            let transaction = WalletDb.transaction(resolve, reject);
            WalletDb.onCreateWallet({
                wallet_public_name: this.state.wallet_public_name,
                password_plaintext: this.state.password,
                brainkey_plaintext: this.state.brainkey,
                private_wifs: this.state.private_wifs,
                unlock: false,
                transaction
            });
        }).then( ()=> {
            // this.setState({wallet_saved: true});
            this.props.addNotification({
                message: `Successfully saved wallet: ${this.state.wallet_public_name}`,
                level: "success",
                autoDismiss: 10
            });

            this.context.router.transitionTo("create-account");

        }).catch(err => {
            console.log("CreateWallet failed:", err);
            this.props.addNotification({
                    message: `Failed to create wallet: ${this.state.wallet_public_name}`,
                    level: "error",
                    autoDismiss: 10
                });
        });
    }
}

WalletCreate.contextTypes = {router: React.PropTypes.func.isRequired};

export default WalletCreate;
