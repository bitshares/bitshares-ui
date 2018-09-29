import {getGatewayStatusByAsset} from "common/gatewayUtils";

function _getCoinToGatewayMapping(boolCheck = "depositAllowed") {
    let coinToGatewayMapping = {};

    this.props.backedCoins.forEach((gateway, gatewayName) => {
        gateway.forEach(coin => {
            // let symbol = coin.backingCoinType || coin.symbol;
            let symbolOnly = coin.symbol.split(".").pop();

            if (!coinToGatewayMapping[symbolOnly])
                coinToGatewayMapping[symbolOnly] = [];

            if (
                coin[boolCheck] &&
                (gateway == "OPEN" ? coin.isAvailable : true)
            )
                coinToGatewayMapping[symbolOnly].push(gatewayName);
        });
    });

    return coinToGatewayMapping;
}

function _getNumberAvailableGateways() {
    const {gatewayStatus, selectedAsset} = this.state;

    var nAvailableGateways = 0;
    for (let g in gatewayStatus) {
        this.props.backedCoins.get(g.toUpperCase(), []).find(c => {
            if (
                ((selectedAsset == c.backingCoinType ||
                    selectedAsset == c.backingCoin) &&
                    c.depositAllowed) ||
                c.isAvailable
            ) {
                nAvailableGateways++;
            }
        });
    }

    return nAvailableGateways;
}

function _onAssetSelected(
    selectedAsset,
    boolCheck = "depositAllowed",
    selectGatewayFn = null
) {
    const {balances, assets} = this.props || {}; //Function must be bound on calling component and these props must be passed to calling component
    let gatewayStatus = getGatewayStatusByAsset.call(
        this,
        selectedAsset,
        boolCheck
    );
    let selectedGateway = this.state.selectedGateway || null;
    let balancesByAssetAndGateway = {};

    if (balances && assets) {
        balances.forEach(balance => {
            if (balance && balance.toJS) {
                let asset = assets.get(balance.get("asset_type"));

                if (asset) {
                    let symbolSplit = asset.symbol.split(".");

                    if (symbolSplit.length == 2) {
                        let symbol = symbolSplit[1];
                        let gateway = symbolSplit[0];

                        if (!balancesByAssetAndGateway[symbol])
                            balancesByAssetAndGateway[symbol] = {};
                        balancesByAssetAndGateway[symbol][
                            gateway
                        ] = balance.get("balance");
                    }
                }
            }
        });
    }

    let {coinToGatewayMapping} = this.state;
    if (
        selectedAsset != this.state.selectedAsset &&
        coinToGatewayMapping &&
        coinToGatewayMapping[selectedAsset]
    ) {
        let gateways = coinToGatewayMapping[selectedAsset];
        if (gateways.length && !selectGatewayFn) {
            //Default gateway selection logic is to pick the gateway with the highest balance, or default to the first available
            if (balancesByAssetAndGateway[selectedAsset]) {
                let greatestBalance = null;
                let greatestBalanceGateway = null;
                for (var gateway in balancesByAssetAndGateway[selectedAsset]) {
                    let balance =
                        balancesByAssetAndGateway[selectedAsset][gateway];

                    if (!greatestBalance) greatestBalance = balance;
                    if (!greatestBalanceGateway)
                        greatestBalanceGateway = gateway;
                }

                selectedGateway =
                    gateways[gateways.indexOf(greatestBalanceGateway)] ||
                    gateways[0];
            } else {
                selectedGateway = gateways[0];
            }
        } else if (gateways.length && selectGatewayFn) {
            selectedGateway = selectGatewayFn(
                coinToGatewayMapping[selectedAsset],
                balancesByAssetAndGateway[selectedAsset]
            );
        }
    }

    this.setState({
        selectedAsset,
        selectedGateway,
        gatewayStatus
    });

    return {selectedAsset, selectedGateway};
}

export {
    _getNumberAvailableGateways,
    _onAssetSelected,
    _getCoinToGatewayMapping
};
