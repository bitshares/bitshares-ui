import React from "react";
import WalletCreate from "components/Wallet/WalletCreate";
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
                        <br/>
                        <br/>
                        <WalletCreate>
                            <ImportKeys
                                key={this.state.import_keys_ref}
                            />
                            <BalanceClaim 
                                ref="balance_claim"
                            />
                        </WalletCreate>
                    </div>
                </div>
            </div>
        );
    }

}

export default ExistingAccount;
