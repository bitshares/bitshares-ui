import React from "react";
import {connect} from "alt-react";
import BindToChainState from "../Utility/BindToChainState";
import GatewayStore from "stores/GatewayStore";
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
            let [gateway, backedCoin] = item.symbol.split(".");

            // Return null if backedCoin is already stored
            if (!idMap[backedCoin] && backedCoin && gateway) {
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
        
        props.backedCoins.forEach((coin) => {
            coinArr = coinArr
                .concat(coin.map(getCoinOption))
                .filter(item => {
                    return item;
                })
                .filter(item => {
                    if(item.id == "BTS") return true;
                    if(include) {
                        return (
                            include.includes(item.id)
                        );
                    }
                    return true;
                });
        });

        let coinItems = coinArr
            .sort(function(a, b) {
                if(a.id && b.id) return a.id.localeCompare(b.id);
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
            backedCoins: GatewayStore.getState().backedCoins,
        };
    }
});
