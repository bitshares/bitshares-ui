import React from "react";
import { RouteHandler, Link } from "react-router";
import AuthenticatedComponent from "../AuthenticatedComponent";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import AssetActions from "actions/AssetActions";
import AltContainer from "alt/AltContainer";

class Wallet extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        AssetActions.getAsset("1.4.0");
    }

    render() {

        // {flexWrap: "nowrap" is needed because medium-horizontal applies wrap, making the layout incorrect}
        return (
            <div className="grid-block vertical medium-horizontal" style={{flexWrap: "nowrap"}}>
              <div className="grid-block shrink large-offset-1 large-2">
                <div className="grid-content">
                  <ul className="condense menu-bar medium-vertical secondary left-menu">
                    <li><Link to="accounts">Accounts</Link></li>
                    <li><Link to="receive">Receive money</Link></li>
                    <li><Link to="assets">Assets</Link></li>
                    <li><Link to="history">History</Link></li>
                  </ul>
                </div>
              </div>
              <AltContainer 
                  stores={[AccountStore, AssetStore]}
                  inject={{
                    accounts: () => {
                        return AccountStore.getState().accounts;
                    },
                    balances: () => {
                        return AccountStore.getState().balances;
                    },
                    currentAccount: () => {
                        return AccountStore.getState().currentAccount;
                    },
                    assets: () => {
                        return AssetStore.getState().assets;
                    }
                  }} 
                  >
                <RouteHandler/>
              </AltContainer>
            </div>
        );
    }
}

Wallet.contextTypes = {router: React.PropTypes.func.isRequired};

export default AuthenticatedComponent(Wallet);
