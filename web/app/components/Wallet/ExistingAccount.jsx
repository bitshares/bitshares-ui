import React from "react";
import Wallet from "components/Wallet/Wallet";
import BalanceClaim from "components/Wallet/BalanceClaim";
import ImportKeys from "components/Wallet/ImportKeys";

class ExistingAccount extends React.Component {
    
    constructor() {
        super();
        this.state = {
            balance_claim_active: true,
            import_active: true
        };
    }
    
    render() {
        return (
            <div id="existing-account" className="grid-block vertical">
                <div className="grid-container">
                    <div className="content-block">
                        <Wallet>
                            <div className="content-block">
                                <h1>Welcome to Graphene</h1>
                            </div>
                            <ImportKeys
                                key={this.state.import_keys_ref}
                            />
                            <BalanceClaim 
                                ref="balance_claim"
                            />
                        </Wallet>
                    </div>
                </div>
            </div>
        );
    }

}

export default ExistingAccount;
