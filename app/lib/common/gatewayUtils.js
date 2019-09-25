import {Apis} from "tuscjs-ws";
import GatewayActions from "actions/GatewayActions";
import availableGateways, {gatewayPrefixes} from "common/gateways";
import counterpart from "counterpart";

export function getGatewayName(asset) {
    if (asset.get("issuer") === "1.2.0") {
        return counterpart.translate("exchange.native");
    }

    let prefix =
        asset.get("symbol") === "PPY"
            ? "RUDEX"
            : asset.get("symbol").split(".")[0];

    let assetName =
        asset.get("symbol") === "PPY" ? "RUDEX.PPY" : asset.get("symbol");

    if (hasGatewayPrefix(assetName)) {
        return availableGateways[prefix].name;
    }
    return null;
}

export function hasGatewayPrefix(name) {
    let prefix = "";
    if (name === "PPY") {
        prefix = "RUDEX";
    } else {
        prefix = name.split(".")[0];
    }

    if (gatewayPrefixes.indexOf(prefix) !== -1) {
        return true;
    }
    return false;
}

export function getGatewayStatusByAsset(
    selectedAsset,
    boolCheck = "depositAllowed"
) {
    let {gatewayStatus} = this.state;
    for (let g in gatewayStatus) {
        gatewayStatus[g].options.enabled = false;
        this.props.backedCoins.get(g.toUpperCase(), []).find(coin => {
            let backingCoin = coin.backingCoinType || coin.backingCoin;
            let isAvailable =
                typeof coin.isAvailable == "undefined" ||
                (typeof coin.isAvailable == "boolean" && coin.isAvailable);

            // Gateway has EOS.* asset names
            if (backingCoin.toUpperCase().indexOf("EOS.") !== -1) {
                let [_network, _coin] = backingCoin.split(".");
                backingCoin = _coin;
            }

            if (
                coin[boolCheck] &&
                isAvailable &&
                selectedAsset == backingCoin
            ) {
                gatewayStatus[g].options.enabled = true;
            }
        });
    }
    return gatewayStatus;
}

export function getIntermediateAccount(symbol, backedCoins) {
    let {selectedGateway} = getAssetAndGateway(symbol);
    let coin = getBackedCoin(symbol, backedCoins);
    if (!coin) return undefined;
    else if (selectedGateway === "RUDEX") return coin.issuerId || coin.issuer;
    else return coin.intermediateAccount || coin.issuer;
}

export function getBackedCoin(symbol, backedCoins) {
    let {selectedGateway} = getAssetAndGateway(symbol);
    return (
        backedCoins.get(selectedGateway, []).find(c => {
            return c.symbol.toUpperCase() === symbol.toUpperCase();
        }) || {}
    );
}

export function getAssetAndGateway(symbol) {
    let [selectedGateway, selectedAsset] = symbol.split(".");
    if (symbol === "PPY") {
        selectedGateway = "RUDEX";
        selectedAsset = "PPY";
    }
    return {selectedGateway, selectedAsset};
}

export function updateGatewayBackers(chain = "4018d784") {
    // Only fetch this when on desired chain, default to main chain
    if (!Apis.instance().chain_id) return;
    if (Apis.instance().chain_id.substr(0, 8) === chain) {
        // BlockTrades
        GatewayActions.fetchPairs.defer();

        // Walk all Gateways
        for (let gateway in availableGateways) {
            if (!!availableGateways[gateway].isEnabled) {
                if (!!availableGateways[gateway].isSimple) {
                    GatewayActions.fetchCoinsSimple.defer({
                        backer: availableGateways[gateway].id,
                        url:
                            availableGateways[gateway].baseAPI.BASE +
                            availableGateways[gateway].baseAPI.COINS_LIST
                    });
                } else {
                    GatewayActions.fetchCoins.defer({
                        backer: availableGateways[gateway].id,
                        url:
                            availableGateways[gateway].baseAPI.BASE +
                            availableGateways[gateway].baseAPI.COINS_LIST,
                        urlBridge:
                            availableGateways[gateway].baseAPI.BASE +
                            availableGateways[gateway].baseAPI.TRADING_PAIRS,
                        urlWallets:
                            availableGateways[gateway].baseAPI.BASE +
                            availableGateways[gateway].baseAPI.ACTIVE_WALLETS
                    });
                }
            }
        }
    }
}
