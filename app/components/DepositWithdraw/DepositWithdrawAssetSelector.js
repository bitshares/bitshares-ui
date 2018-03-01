import React from "react";
import {connect} from "alt-react";
import BindToChainState from "../Utility/BindToChainState";
import {Apis} from "bitsharesjs-ws";
import {rudexAPIs} from "api/apiConfig";
import GatewayStore from "stores/GatewayStore";
import GatewayActions from "actions/GatewayActions";
import TypeAhead from "../Utility/TypeAhead";
import counterpart from "counterpart";

class DepositWithdrawAssetSelector extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {props} = this;
        const {include} = props;
        let idMap = {};

        let getCoinOption = item => {
            /* Gateway Specific Settings */
            let gateway;
            let backedCoin;

            if (
                item.intermediateAccount &&
                (item.intermediateAccount == "openledger-dex" ||
                    item.intermediateAccount == "openledger-wallet")
            ) {
                gateway = "OPEN";
                backedCoin = item.backingCoinType;
            } else if (
                item.gatewayWallet &&
                (item.gatewayWallet == "rudex" ||
                    item.gatewayWallet == "rudex-gateway")
            ) {
                gateway = "RUDEX";
                backedCoin = item.backingCoin;
            } else {
                console.log("Not Found");
                console.log(item);
            }

            // Return null if backedCoin is already stored
            if (!idMap[backedCoin]) {
                idMap[backedCoin] = true;

                return {
                    id: backedCoin,
                    label: backedCoin,
                    gateway: gateway,
                    gateFee: item.gateFee,
                    issuer: item.issuerId || "1.2.96397" //Fall back to open ledger
                };
            } else {
                return null;
            }
        };

        let coinArr = [];

        if (!(this.props.includeBTS === false)) {
            coinArr.push({id: "BTS", label: "BTS", gateway: ""});
        }

        let coinItems = coinArr
            .concat(props.openLedgerBackedCoins.map(getCoinOption))
            .concat(props.rudexBackedCoins.map(getCoinOption))
            .concat(props.blockTradesBackedCoins.map(getCoinOption))
            .filter(item => {
                return item;
            })
            .filter(item => {
                let symbolWithGateway = item.gateway + "." + item.id;
                let symbolWithoutGateway = item.id;

                if (symbolWithoutGateway == "BTS") return true;

                if (include) {
                    return (
                        include.includes(symbolWithGateway) ||
                        include.includes(symbolWithoutGateway)
                    );
                }

                return true;
            })
            .sort(function(a, b) {
                return a.id.localeCompare(b.id);
            });

        let i18n =
            props.usageContext == "withdraw"
                ? "gateway.asset_search_withdraw"
                : "gateway.asset_search_deposit";

        return (
            <TypeAhead
                items={coinItems}
                {...this.props}
                inputProps={{placeholder: counterpart.translate(i18n)}}
                label="gateway.asset"
            />
        );
    }
}
DepositWithdrawAssetSelector = BindToChainState(DepositWithdrawAssetSelector);

export default connect(DepositWithdrawAssetSelector, {
    listenTo() {
        return [GatewayStore];
    },
    getProps() {
        return {
            openLedgerBackedCoins: GatewayStore.getState().backedCoins.get(
                "OPEN",
                []
            ),
            rudexBackedCoins: GatewayStore.getState().backedCoins.get(
                "RUDEX",
                []
            ),
            blockTradesBackedCoins: GatewayStore.getState().backedCoins.get(
                "TRADE",
                []
            )
        };
    }
});
