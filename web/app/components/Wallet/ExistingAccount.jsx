import React from "react";
import Wallet from "components/Wallet/Wallet";
import BalanceClaim from "components/Wallet/BalanceClaim";
import ImportKeys from "components/Wallet/ImportKeys";

class ExistingAccount extends React.Component {
    
    constructor() {
        super();
        this.state = {
            balance_claim_active: false,
            import_active: true
        };
    }
    
    render() {
        
        return (
            <div id="existing-account" className="grid-block vertical">
                <div className="grid-container">
                    <div className="content-block center-content">
                        <Wallet>
                            <div className="content-block">
                                <h1>Welcome to Graphene</h1>
                            </div>
                            {this.state.balance_claim_active ? (
                                <BalanceClaim 
                                    ref="balance_claim"
                                    exportState={this._fetchState.bind(this)}
                                />
                            ) : null}
                            
                            {this.state.import_active ? (
                                <ImportKeys
                                    key={this.state.import_keys_ref}
                                    exportState={this._fetchState.bind(this)}
                                />
                            ) : null}
                        </Wallet>
                    </div>
                </div>
            </div>
        );
    }

    _fetchState(state) {
        this.setState(state);
    }
}

export default ExistingAccount;
