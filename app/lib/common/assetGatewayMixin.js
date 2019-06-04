import React from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {getGatewayStatusByAsset} from "common/gatewayUtils";
import {Link} from "react-router-dom";
import {Select, Icon} from "bitshares-ui-style-guide";
import utils from "common/utils";

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
            if (!!balance && !!balance.toJS) {
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

function gatewaySelector(args) {
    let {
        selectedGateway,
        gatewayStatus,
        nAvailableGateways,
        error,
        onGatewayChanged,
        selectedAsset = null,
        balances = null,
        assets = null
    } = args;

    let balancesByAssetAndGateway = {};
    if (balances && assets) {
        balances.forEach(balance => {
            if (!!balance && !!balance.toJS) {
                let asset = assets.get(balance.get("asset_type"));

                if (asset) {
                    let symbolSplit = asset.symbol.split(".");

                    if (symbolSplit.length == 2) {
                        let symbol = symbolSplit[1];
                        let gateway = symbolSplit[0];

                        if (!balancesByAssetAndGateway[symbol])
                            balancesByAssetAndGateway[symbol] = {};
                        balancesByAssetAndGateway[symbol][gateway] = [
                            balance.get("balance"),
                            asset
                        ];
                    }
                }
            }
        });
    }

    let supportLink =
        !!selectedGateway && !!gatewayStatus[selectedGateway]
            ? "/help/gateways/" +
              gatewayStatus[selectedGateway].name.toLowerCase().replace("-", "")
            : null;

    let gateways = [];
    Object.keys(gatewayStatus).map(key => {
        gateways.push(gatewayStatus[key]);

        // Set to full name to work with <Select>
        if (gatewayStatus[key].id == selectedGateway) {
            selectedGateway = gatewayStatus[key].name;
        }
    });

    gateways.sort((a, b) => {
        if (a.name > b.name) return 1;
        else if (a.name < b.name) return -1;
        else return 0;
    });

    return (
        <div>
            <div className="no-margin no-padding">
                <section className="block-list">
                    <label className="left-label">
                        <Translate content="modal.deposit_withdraw.gateway" />
                        {selectedGateway ? (
                            <Link to={supportLink} style={{cursor: "pointer"}}>
                                &nbsp;
                                <Icon type="question-circle" />
                            </Link>
                        ) : null}
                        <span className="floatRight error-msg">
                            {!error &&
                            selectedGateway &&
                            gatewayStatus[selectedGateway] &&
                            !gatewayStatus[selectedGateway].options.enabled ? (
                                <Translate
                                    content="modal.deposit_withdraw.disabled"
                                    with={{
                                        gateway:
                                            gatewayStatus[selectedGateway].name
                                    }}
                                />
                            ) : null}
                            {error ? (
                                <Translate content="modal.deposit_withdraw.wallet_error" />
                            ) : null}
                            {!selectedGateway && nAvailableGateways == 0 ? (
                                <Translate content="modal.deposit_withdraw.no_gateway_available" />
                            ) : null}
                        </span>
                    </label>

                    <div className="inline-label input-wrapper">
                        <Select
                            optionLabelProp={"value"}
                            onChange={onGatewayChanged}
                            placeholder={counterpart.translate(
                                "modal.deposit_withdraw.select_gateway"
                            )}
                            value={selectedGateway}
                            style={{width: "100%"}}
                        >
                            {gateways.map(g => {
                                if (g.options.enabled) {
                                    return (
                                        <Select.Option
                                            key={g.name}
                                            value={g.id}
                                        >
                                            {g.name}
                                            {balancesByAssetAndGateway &&
                                            balancesByAssetAndGateway[
                                                selectedAsset
                                            ] &&
                                            balancesByAssetAndGateway[
                                                selectedAsset
                                            ][g.id] ? (
                                                <span style={{float: "right"}}>
                                                    {utils.format_asset(
                                                        balancesByAssetAndGateway[
                                                            selectedAsset
                                                        ][g.id][0],
                                                        balancesByAssetAndGateway[
                                                            selectedAsset
                                                        ][g.id][1]
                                                    )}
                                                </span>
                                            ) : null}
                                        </Select.Option>
                                    );
                                }
                            })}
                        </Select>
                    </div>
                </section>
            </div>
        </div>
    );
}

export {
    gatewaySelector,
    _getNumberAvailableGateways,
    _onAssetSelected,
    _getCoinToGatewayMapping
};
