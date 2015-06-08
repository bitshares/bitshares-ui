import React from "react";
import AccountStore from "stores/AccountStore";
import AssetStore from "stores/AssetStore";
import AltContainer from "alt/AltContainer";
import Asset from "./Asset";

class AssetContainer extends React.Component {

    render() {
        let symbol = this.context.router.getCurrentParams().symbol;
        return (
              <AltContainer 
                  stores={[AccountStore, AssetStore]}
                  inject={{
                    assets: () => {
                        return AssetStore.getState().assets;
                    },
                    asset_symbol_to_id: () => {
                        return AssetStore.getState().asset_symbol_to_id;
                    },
                    accounts: () => {
                        return AccountStore.getState().account_id_to_name;
                    }                    
                  }} 
                  >
                <Asset symbol={symbol}/>
              </AltContainer>
        );
    }
}

AssetContainer.contextTypes = { router: React.PropTypes.func.isRequired };

export default AssetContainer;
