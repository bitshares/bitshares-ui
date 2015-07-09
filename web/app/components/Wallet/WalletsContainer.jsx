import React from "react";
import AltContainer from "alt/AltContainer";

import Wallet from "./Wallet";
import WalletDb from "stores/WalletDb";

class WalletsContainer extends React.Component {

    render() {
        return (
            <AltContainer 
                stores={[WalletDb]}
                inject={{
                    wallets: () => {
                        return WalletDb.wallets;
                    }
                }}
            >
                <Wallet/>
            </AltContainer>
        )
    }
}

export default WalletsContainer;
