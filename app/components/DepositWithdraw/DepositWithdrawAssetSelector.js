import React from "react";
import { connect } from "alt-react";
import BindToChainState from "../Utility/BindToChainState";
import { Apis } from "bitsharesjs-ws";
import { rudexAPIs } from "api/apiConfig";
import GatewayStore from "stores/GatewayStore";
import GatewayActions from "actions/GatewayActions";
import TypeAhead from "../Utility/TypeAhead";

class DepositWithdrawAssetSelector  extends React.Component {
    constructor (props) {
        super(props);
    }

    render(){
        const { props } = this;
        let idMap = {};

        let getCoinOption = (item) => {
            /* Gateway Specific Settings */
            let gateway;
            let backedCoin;

            if(item.intermediateAccount && (item.intermediateAccount == "openledger-dex" || item.intermediateAccount == "openledger-wallet")) {
                gateway = "OPEN";
                backedCoin = item.backingCoinType;
            } else if(item.gatewayWallet && (item.gatewayWallet == "rudex" || item.gatewayWallet == "rudex-gateway")) {
                gateway = "RUDEX";
                backedCoin = item.backingCoin;
            } else {
                console.log("Not Found");
                console.log(item);
            }

            // Return null if backedCoin is already stored
            if(!idMap[backedCoin]) {
                idMap[backedCoin] = true;
                return { id: backedCoin, label: backedCoin, gateway: gateway };
            } else {
                return null;
            }
        };

        let coinItems = [{id: "BTS", label: "BTS", gateway: ""}].concat(props.openLedgerBackedCoins.map(getCoinOption)).concat(props.rudexBackedCoins.map(getCoinOption)).concat(props.blockTradesBackedCoins.map(getCoinOption)).filter((item) => { return item; }).sort(function(a, b) { return a.id.localeCompare(b.id); });

        return <TypeAhead items={coinItems} {...this.props} label="gateway.asset" />;
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
