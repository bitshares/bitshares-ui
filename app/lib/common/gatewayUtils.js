import {Apis} from "bitsharesjs-ws";
import GatewayActions from "actions/GatewayActions";
import {rudexAPIs, widechainAPIs, blockTradesAPIs} from "api/apiConfig";

export function getGatewayStatusByAsset(selectedAsset, boolCheck = "depositAllowed") {
    let {gatewayStatus} = this.state;

    for (let g in gatewayStatus) {
        
        gatewayStatus[g].enabled = false;
        this.props.backedCoins.get(g.toUpperCase(), []).find(c => {
            if(c[boolCheck] && 
                (typeof c.isAvailable == "undefined" || (typeof c.isAvailable == "boolean" && c.isAvailable)) && 
                (selectedAsset == c.backingCoinType || selectedAsset == c.backingCoin)
            ) {
                gatewayStatus[g].enabled = true;
            }
        });
    }
    return gatewayStatus;
}

export function getIntermediateAccount(symbol, backedCoins) {
    let {selectedGateway} = getAssetAndGateway(symbol);
    let coin = getBackedCoin(symbol, backedCoins);
    if (!coin) return undefined;
    if (selectedGateway === "RUDEX") return coin.issuerId || coin.issuer;
    if (selectedGateway === "OPEN")
        return coin.intermediateAccount || coin.issuer;
    else return coin.issuer;
}

export function getBackedCoin(symbol, backedCoins) {
    let {selectedGateway} = getAssetAndGateway(symbol);
    return (
        backedCoins.get(selectedGateway, []).find(c => {
            return c.symbol === symbol;
        }) || {}
    );
}

export function getAssetAndGateway(symbol) {
    let pieces = symbol.split(".");
    let selectedGateway = pieces[0];
    let selectedAsset = pieces[1];
    if (symbol === "PPY") {
        selectedGateway = "RUDEX";
        selectedAsset = "PPY";
    }
    return {selectedGateway, selectedAsset};
}

export function updateGatewayBackers(chain = "4018d784") {
    // Only fetch this when on BTS main net
    if (Apis.instance().chain_id.substr(0, 8) === chain) {
        // OpenLedger
        GatewayActions.fetchCoins.defer();

        // WinEx
        GatewayActions.fetchCoins.defer({
            backer: "WIN", 
            url: widechainAPIs.BASE + widechainAPIs.COINS_LIST,
            urlBridge: widechainAPIs.BASE,
            urlWallets: widechainAPIs.BASE + widechainAPIs.ACTIVE_WALLETS
        });

        // RuDEX
        GatewayActions.fetchCoinsSimple.defer({
            backer: "RUDEX",
            url: rudexAPIs.BASE + rudexAPIs.COINS_LIST
        }); 

        // BlockTrades
        GatewayActions.fetchBridgeCoins.defer();

        /* // GDex does not comply with current standards
        GatewayActions.fetchCoins.defer({
            backer: "GDEX",
            url: 
        });
        */

        /*
        // BlockTrades
        GatewayActions.fetchCoins.defer({
            backer: "TRADE"
        }); 
        */
    } 
}