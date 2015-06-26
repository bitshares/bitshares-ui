import React from "react";
import AltContainer from "alt/AltContainer";

import Wallet from "./Wallet";
import WalletStore from "stores/WalletStore";

class WalletsContainer extends React.Component {

    render() {
        return (
            <AltContainer 
                stores={[WalletStore]}
                inject={{
                    wallets: () => {
                        return WalletStore.getState().wallets;
                    }
                }}
            >
                <Wallet/>
            </AltContainer>
        )
    }
}

export default WalletsContainer;
