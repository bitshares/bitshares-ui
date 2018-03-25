import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "../Modal/BaseModal";
import Translate from "react-translate-component";
import utils from "common/utils";
import {requestDepositAddress} from "common/blockTradesMethods";
import BlockTradesDepositAddressCache from "common/BlockTradesDepositAddressCache";
import CopyButton from "../Utility/CopyButton";
import Icon from "../Icon/Icon";
import LoadingIndicator from "../LoadingIndicator";
import {DecimalChecker} from "../Exchange/ExchangeInput";
import QRCode from "qrcode.react";
import DepositWithdrawAssetSelector from "../DepositWithdraw/DepositWithdrawAssetSelector.js";
import {
    _getAvailableGateways,
    gatewaySelector,
    _getNumberAvailableGateways,
    _onAssetSelected,
    _getCoinToGatewayMapping
} from "lib/common/assetGatewayMixin";

class DepositModalContent extends DecimalChecker {
    constructor() {
        super();

        this.state = {
            depositAddress: "",
            selectedAsset: "",
            selectedGateway: null,
            fetchingAddress: false,
            backingAsset: null,
            gatewayStatus: {
                OPEN: {
                    id: "OPEN",
                    name: "OPENLEDGER",
                    enabled: false,
                    selected: false,
                    support_url:
                        "https://wallet.bitshares.org/#/help/gateways/openledger"
                },
                RUDEX: {
                    id: "RUDEX",
                    name: "RUDEX",
                    enabled: false,
                    selected: false,
                    support_url:
                        "https://wallet.bitshares.org/#/help/gateways/rudex"
                }
            }
        };

        this.deposit_address_cache = new BlockTradesDepositAddressCache();
        this.addDepositAddress = this.addDepositAddress.bind(this);
    }

    onClose() {
        ZfApi.publish(this.props.modalId, "close");
    }

    componentWillMount() {
        let {asset} = this.props;

        let coinToGatewayMapping = _getCoinToGatewayMapping.call(this);
        this.setState({coinToGatewayMapping});

        if (!asset) return;

        let backedAsset = asset.split(".");
        let usingGateway = this.state.gatewayStatus[backedAsset[0]]
            ? true
            : false;

        if (usingGateway) {
            let assetName = backedAsset[1];
            let assetGateway = backedAsset[0];
            this._getDepositAddress(assetName, assetGateway);
        } else {
            this.setState({selectedAsset: "BTS"});
        }
    }

    shouldComponentUpdate(np, ns) {
        return !utils.are_equal_shallow(ns, this.state);
    }

    onGatewayChanged(e) {
        if (!e.target.value) return;
        this._getDepositAddress(this.state.selectedAsset, e.target.value);
    }

    onAssetSelected(asset, assetDetails) {
        if (assetDetails.gateway == "")
            return this.setState({selectedAsset: asset, selectedGateway: null});

        let {selectedAsset, selectedGateway} = _onAssetSelected.call(
            this,
            asset,
            "depositAllowed",
            (availableGateways, balancesByGateway) => {
                if (availableGateways && availableGateways.length == 1)
                    return availableGateways[0]; //autoselect gateway if exactly 1 item
                return null;
            }
        );

        if (selectedGateway) {
            this._getDepositAddress(selectedAsset, selectedGateway);
        }
    }

    _getDepositAddress(selectedAsset, selectedGateway) {
        let {account} = this.props;

        this.setState({
            fetchingAddress: true,
            depositAddress: null,
            gatewayStatus: _getAvailableGateways.call(this, selectedAsset)
        });

        // Get Backing Asset for Gateway
        let backingAsset = this.props.backedCoins
            .get(selectedGateway.toUpperCase(), [])
            .find(c => {
                return (
                    c.backingCoinType === selectedAsset ||
                    c.backingCoin === selectedAsset
                );
            });

        if (!backingAsset) {
            //console.log(selectedGateway + " does not support " + selectedAsset);
            this.setState({
                depositAddress: null,
                selectedAsset,
                selectedGateway,
                fetchingAddress: false
            });
            return;
        }

        if (selectedGateway == "OPEN") {
            this.setState({
                isOpenledger: true
            });
            let depositAddress = this.deposit_address_cache.getCachedInputAddress(
                selectedGateway.toUpperCase(),
                account,
                selectedAsset.toLowerCase(),
                selectedGateway.toLowerCase() +
                    "." +
                    selectedAsset.toLowerCase()
            );
            if (!depositAddress) {
                requestDepositAddress({
                    inputCoinType: selectedAsset.toLowerCase(),
                    outputCoinType: "open." + selectedAsset.toLowerCase(),
                    outputAddress: account,
                    stateCallback: this.addDepositAddress
                });
            } else {
                this.setState({
                    depositAddress,
                    fetchingAddress: false
                });
            }
        } else if (selectedGateway == "RUDEX") {
            this.setState({
                depositAddress: {
                    address: backingAsset.gatewayWallet,
                    memo: "dex:" + account
                },
                fetchingAddress: false,
                isOpenledger: false
            });
        } else {
            console.log(
                "Withdraw Modal Error: Unknown Gateway " +
                    selectedGateway +
                    " for asset " +
                    selectedAsset
            );
        }

        this.setState({
            selectedAsset,
            selectedGateway,
            backingAsset
        });
    }

    addDepositAddress(depositAddress) {
        let {selectedGateway, selectedAsset} = this.state;
        let {account} = this.props;

        this.deposit_address_cache.cacheInputAddress(
            "OPEN",
            account,
            selectedAsset.toLowerCase(),
            selectedGateway.toLowerCase() + "." + selectedAsset.toLowerCase(),
            depositAddress.address,
            depositAddress.memo
        );
        this.setState({
            depositAddress,
            fetchingAddress: false
        });
    }

    render() {
        let {
            selectedAsset,
            selectedGateway,
            depositAddress,
            fetchingAddress,
            gatewayStatus,
            backingAsset
        } = this.state;
        let {account} = this.props;
        let usingGateway = true;

        if (selectedGateway == null && selectedAsset == "BTS") {
            usingGateway = false;
            depositAddress = {address: account};
        }

        // Count available gateways
        let nAvailableGateways = _getNumberAvailableGateways.call(this);

        const QR =
            depositAddress &&
            depositAddress.address &&
            !depositAddress.error ? (
                <div className="QR">
                    <QRCode size={140} value={depositAddress.address} />
                </div>
            ) : (
                <div>
                    <Icon size="5x" name="minus-circle" />
                    <p className="error-msg">
                        <Translate content="modal.deposit.address_generation_error" />
                    </p>
                </div>
            );

        return (
            <div className="grid-block vertical no-overflow">
                <div className="modal__header">
                    {usingGateway && account ? (
                        <Translate
                            component="p"
                            content="modal.deposit.header"
                            account_name={
                                <span className="modal__highlight">
                                    {account}
                                </span>
                            }
                        />
                    ) : (
                        <Translate
                            component="p"
                            content="modal.deposit.header_short"
                        />
                    )}
                </div>
                <div className="modal__body">
                    <div className="container-row">
                        <div className="no-margin no-padding">
                            <div className="inline-label input-wrapper">
                                <DepositWithdrawAssetSelector
                                    defaultValue={selectedAsset}
                                    onSelect={this.onAssetSelected.bind(this)}
                                    selectOnBlur
                                />
                            </div>
                        </div>
                    </div>

                    {usingGateway && selectedAsset
                        ? gatewaySelector.call(this, {
                              selectedGateway,
                              gatewayStatus,
                              nAvailableGateways,
                              error: depositAddress && depositAddress.error,
                              onGatewayChanged: this.onGatewayChanged.bind(this)
                          })
                        : null}

                    {!fetchingAddress ? (
                        (!usingGateway ||
                            (usingGateway &&
                                selectedGateway &&
                                gatewayStatus[selectedGateway].enabled)) &&
                        depositAddress &&
                        !depositAddress.memo ? (
                            <div
                                className="container-row"
                                style={{textAlign: "center"}}
                            >
                                {QR}
                            </div>
                        ) : null
                    ) : (
                        <div
                            className="container-row"
                            style={{textAlign: "center"}}
                        >
                            <LoadingIndicator type="three-bounce" />
                        </div>
                    )}
                    {selectedGateway &&
                    gatewayStatus[selectedGateway].enabled &&
                    depositAddress &&
                    !depositAddress.error ? (
                        <div className="container-row">
                            {backingAsset.minAmount ? (
                                <div className="grid-block container-row maxDeposit">
                                    <Translate
                                        content="gateway.rudex.min_amount"
                                        minAmount={utils.format_number(
                                            backingAsset.minAmount /
                                                utils.get_asset_precision(
                                                    backingAsset.precision
                                                ),
                                            backingAsset.precision,
                                            false
                                        )}
                                        symbol={selectedAsset}
                                    />
                                </div>
                            ) : null}
                            {this.state.isOpenledger && (
                                <Translate
                                    className="grid-block container-row maxDeposit"
                                    style={{fontSize: "1rem"}}
                                    content="gateway.min_deposit_warning_amount"
                                    minDeposit={backingAsset.gateFee * 2 || 0}
                                    coin={selectedAsset}
                                />
                            )}

                            <div className="grid-block container-row">
                                <div style={{paddingRight: "1rem"}}>
                                    <CopyButton
                                        text={depositAddress.address}
                                        className={"copyIcon"}
                                    />
                                </div>
                                <div>
                                    <Translate
                                        component="div"
                                        style={{
                                            fontSize: "0.8rem",
                                            fontWeight: "bold",
                                            paddingBottom: "0.3rem"
                                        }}
                                        content="gateway.purchase_notice"
                                        inputAsset={selectedAsset}
                                        outputAsset={
                                            selectedGateway +
                                            "." +
                                            selectedAsset
                                        }
                                    />
                                    <div className="modal__highlight">
                                        {depositAddress.address}
                                    </div>
                                </div>
                            </div>
                            {depositAddress.memo ? (
                                <div className="grid-block container-row">
                                    <div style={{paddingRight: "1rem"}}>
                                        <CopyButton
                                            text={depositAddress.memo}
                                            className={"copyIcon"}
                                        />
                                    </div>
                                    <div>
                                        <Translate
                                            component="div"
                                            style={{
                                                fontSize: "0.8rem",
                                                fontWeight: "bold",
                                                paddingBottom: "0.3rem"
                                            }}
                                            unsafe
                                            content="gateway.purchase_notice_memo"
                                        />
                                        <div className="modal__highlight">
                                            {depositAddress.memo}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            {this.state.isOpenledger && (
                                <Translate
                                    component="span"
                                    style={{fontSize: "0.8rem"}}
                                    content="gateway.min_deposit_warning_asset"
                                    minDeposit={backingAsset.gateFee * 2 || 0}
                                    coin={selectedAsset}
                                />
                            )}
                        </div>
                    ) : null}
                    {!usingGateway ? (
                        <div className="container-row deposit-directly">
                            <h2
                                className="modal__highlight"
                                style={{textAlign: "center"}}
                            >
                                {account}
                            </h2>
                            <Translate
                                component="h6"
                                content="modal.deposit.bts_transfer_description"
                            />
                        </div>
                    ) : null}
                </div>

                <div className="Modal__footer">
                    <div className="container-row">
                        <button
                            className="button primary hollow"
                            onClick={this.onClose.bind(this)}
                        >
                            <Translate content="modal.deposit.close" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default class DepositModal extends React.Component {
    constructor() {
        super();

        this.state = {open: false};
    }

    show() {
        this.setState({open: true}, () => {
            ZfApi.publish(this.props.modalId, "open");
        });
    }

    onClose() {
        this.setState({open: false});
    }

    render() {
        return !this.state.open ? null : (
            <BaseModal
                id={this.props.modalId}
                className={this.props.modalId}
                onClose={this.onClose.bind(this)}
                overlay={true}
                noCloseBtn
            >
                <DepositModalContent {...this.props} open={this.state.open} />
            </BaseModal>
        );
    }
}
