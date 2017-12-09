import React from "react";
import { connect } from "alt-react";
import Translate from "react-translate-component";
import BindToChainState from "../Utility/BindToChainState";
import { Apis } from "bitsharesjs-ws";
import { settingsAPIs, rudexAPIs } from "api/apiConfig";
import GatewayStore from "stores/GatewayStore";
import GatewayActions from "actions/GatewayActions";
import TypeAhead from "../Utility/TypeAhead";

class DepositWithdrawAssetSelector  extends React.Component {
    render(){
        const { props } = this;

        let getCoinOption = (item)=>{
            return {id: item.symbol, label: item.symbol}
        }

        let coinItems = props.openLedgerBackedCoins.map(getCoinOption).concat(props.rudexBackedCoins.map(getCoinOption)).concat(props.blockTradesBackedCoins.map(getCoinOption));

        return <TypeAhead items={coinItems} />
    }
};
DepositWithdrawAssetSelector = BindToChainState(DepositWithdrawAssetSelector);

class DepositStoreWrapper extends React.Component {

    componentWillMount() {
        if (Apis.instance().chain_id.substr(0, 8) === "4018d784") { // Only fetch this when on BTS main net
            GatewayActions.fetchCoins.defer(); // Openledger
            GatewayActions.fetchCoinsSimple.defer({backer: "RUDEX", url:rudexAPIs.BASE+rudexAPIs.COINS_LIST}); // RuDEX
            GatewayActions.fetchCoins.defer({backer: "TRADE"}); // Blocktrades
        }
    }

    render() {
        return <DepositWithdrawAssetSelector {...this.props}/>;
    }
}

export default connect(DepositStoreWrapper, {
    listenTo() {
        return [GatewayStore];
    },
    getProps() {
        return {
            openLedgerBackedCoins: GatewayStore.getState().backedCoins.get("OPEN", []),
            rudexBackedCoins: GatewayStore.getState().backedCoins.get("RUDEX", []),
            blockTradesBackedCoins: GatewayStore.getState().backedCoins.get("TRADE", [])
        };
    }
});
