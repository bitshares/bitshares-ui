import React from "react";
import WalletManager, {WalletOptions, ChangeActiveWallet, WalletDelete} from "../Wallet/WalletManager";
import BalanceClaimActive from "../Wallet/BalanceClaimActive";
import Translate from "react-translate-component";

export default class AccountsSettings extends React.Component {

    constructor() {
        super();

        this.state = {
            lookupActive: false
        };
    }

    onLookup() {
        this.setState({
            lookupActive: !this.state.lookupActive
        });
    }

    render() {
        let {lookupActive} = this.state;

        return (
            <div>

                <ChangeActiveWallet />
                <WalletDelete />
                <section style={{padding: "15px 0"}} className="block-list">
                    <header><Translate content="wallet.balance_claims" />:</header>

                </section>
                <div style={{paddingBottom: 10}}>
                    <Translate content="settings.lookup_text" />:
                </div>
                <div className="button outline" onClick={this.onLookup.bind(this)}>
                        Lookup balances
                </div>


                {lookupActive ? <BalanceClaimActive /> : null}

            </div>
        );
    }
};
