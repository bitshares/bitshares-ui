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
