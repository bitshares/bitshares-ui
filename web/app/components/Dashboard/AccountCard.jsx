import React from "react";
import AccountImage from "../Account/AccountImage";
import AccountActions from "actions/AccountActions";
import FormattedAsset from "../Utility/FormattedAsset";
import validation from "common/validation.coffee";
import {Link} from "react-router";

class AccountCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {newAccount: "", error: false};
    }

    validateName(name, submit) {
        if (validation.is_account_name(this.state.newAccount)) {
            this.setState({error: false});
            if (submit) {
                AccountActions.addAccount(this.state.newAccount);
                this.state.newAccount = ""; 
            }
        } else {
            this.setState({error: true});
        }
    }

    _onInput(e) {
        if (validation.is_account_name(e.target.value)) {
            this.setState({error: false, newAccount: e.target.value});
        } else {
            this.setState({error: true, newAccount: e.target.value});
        }
    }

    _addAccount(e) {
        e.preventDefault();
        if (validation.is_account_name(this.state.newAccount)) {
            this.setState({error: false, newAccount: ""});
            AccountActions.addAccount(this.state.newAccount);
        } else {
            this.setState({error: true});
        }
    }

    render() {
        if (this.props.new) {
            return (
                    <div className="grid-content account-card">
                        <div className="card">
                            <div>
                                {this.state.newAccount.length > 0 ? <AccountImage account={this.state.newAccount} size={{height: 150, width: 150}}/> : 
                                <span style={{fontSize: "150px", color: "#B2B2B2"}}>+</span>}
                            </div>
                            <div className="card-divider">
                                <input type="text" onChange={this._onInput.bind(this)} value={this.state.newAccount}/>
                                {this.state.error ? <p style={{color: "red"}}>That name is not valid</p> : null}
                            </div>
                            <div className="card-section">
                                <h5>
                                    <center>
                                        <button className="button hollow" onClick={this._addAccount.bind(this)}>Create new account</button>
                                    </center>
                                </h5>
                            </div>
                        </div>
                    </div>
                );
        }

        let {account, assets, balances} = this.props;

        let accountBalances = balances.map((balance) => {
            return (
                <div key={balance.asset_id} className="text-group">
                    <span>
                        <FormattedAsset amount={parseFloat(balance.amount)} asset={assets.get(balance.asset_id)}/>
                    </span>
                </div>);
        });

        return (
            <div style={{padding: "0.5em 0.5em"}} className="grid-content account-card">
                <div className="card">
                    <Link to="account" params={{name: account.name}}>
                        <div>
                            <AccountImage account={account.name} size={{height: 150, width: 150}}/>
                        </div>
                        <div className="card-divider">
                            {account.name}
                        </div>
                        <div className="card-section">
                            {accountBalances}
                        </div>
                    </Link>
                </div>
            </div>
        );
    }
}

export default AccountCard;
