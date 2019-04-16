import React from "react";
import Translate from "react-translate-component";
import utils from "common/utils";
import {requestDepositAddress} from "common/gatewayMethods";
import BlockTradesDepositAddressCache from "common/BlockTradesDepositAddressCache";
import CopyButton from "../Utility/CopyButton";
import Icon from "../Icon/Icon";
import LoadingIndicator from "../LoadingIndicator";
import {DecimalChecker} from "../Utility/DecimalChecker";
import DepositWithdrawAssetSelector from "../DepositWithdraw/DepositWithdrawAssetSelector.js";
import {
    gatewaySelector,
    _getNumberAvailableGateways,
    _onAssetSelected,
    _getCoinToGatewayMapping
} from "lib/common/assetGatewayMixin";
import {availableGateways} from "common/gateways";
import {getGatewayStatusByAsset} from "common/gatewayUtils";
import CryptoLinkFormatter from "../Utility/CryptoLinkFormatter";
import counterpart from "counterpart";
import {Modal, Button} from "bitshares-ui-style-guide";

class DepositModalContent extends DecimalChecker {
    constructor() {
        super();

        this.state = this._intitalState();

        this.deposit_address_cache = new BlockTradesDepositAddressCache();
        this.addDepositAddress = this.addDepositAddress.bind(this);
    }

    onClose() {
        this.props.hideModal();
    }

    componentWillMount() {
        let {asset} = this.props;
        this._setDepositAsset(asset);
    }

    shouldComponentUpdate(np, ns) {
        if (np.asset !== this.props.asset) {
            this.setState(this._intitalState());
            this._setDepositAsset(np.asset);
        }
        return !utils.are_equal_shallow(ns, this.state);
    }

    onGatewayChanged(selectedGateway) {
        this._getDepositAddress(this.state.selectedAsset, selectedGateway);
    }

    onAssetSelected(asset) {
        if (asset.gateway == "")
            return this.setState({
                selectedAsset: asset.id,
                selectedGateway: null
            });

        let {selectedAsset, selectedGateway} = _onAssetSelected.call(
            this,
            asset.id,
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

    _intitalState() {
        return {
            depositAddress: "",
            selectedAsset: "",
            selectedGateway: null,
            fetchingAddress: false,
            backingAsset: null,
            gatewayStatus: availableGateways
        };
    }

    _setDepositAsset(asset) {
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

    _getDepositObject(assetName, fullAssetName, selectedGateway, url) {
        let {props, state} = this;
        let {account} = props;
        let {gatewayStatus} = state;

        return {
            inputCoinType: gatewayStatus[selectedGateway].useFullAssetName
                ? fullAssetName.toLowerCase()
                : assetName.toLowerCase(),
            outputCoinType: fullAssetName.toLowerCase(),
            outputAddress: account,
            url: url,
            stateCallback: this.addDepositAddress,
            selectedGateway: selectedGateway
        };
    }

    _getDepositAddress(selectedAsset, selectedGateway) {
        let {account} = this.props;
        let {gatewayStatus} = this.state;

        this.setState({
            fetchingAddress: true,
            depositAddress: null,
            gatewayStatus: getGatewayStatusByAsset.call(this, selectedAsset)
        });

        // Get Backing Asset for Gateway
        let backingAsset = this.props.backedCoins
            .get(selectedGateway.toUpperCase(), [])
            .find(c => {
                let backingCoin = c.backingCoinType || c.backingCoin;

                if (backingCoin.toUpperCase().indexOf("EOS.") !== -1) {
                    backingCoin = backingCoin.split(".")[1];
                }

                return (
                    backingCoin.toUpperCase() === selectedAsset.toUpperCase()
                );
            });

        if (!backingAsset) {
            console.log(selectedGateway + " does not support " + selectedAsset);
            this.setState({
                depositAddress: null,
                selectedAsset,
                selectedGateway,
                fetchingAddress: false
            });
            return;
        }

        let depositAddress;
        if (selectedGateway && selectedAsset) {
            depositAddress = this.deposit_address_cache.getCachedInputAddress(
                selectedGateway.toLowerCase(),
                account,
                selectedAsset.toLowerCase(),
                selectedGateway.toLowerCase() +
                    "." +
                    selectedAsset.toLowerCase()
            );
        }

        if (!!gatewayStatus[selectedGateway].simpleAssetGateway) {
            this.setState({
                depositAddress: {
                    address: backingAsset.gatewayWallet,
                    memo: !gatewayStatus[selectedGateway].fixedMemo
                        ? account
                        : gatewayStatus[selectedGateway].fixedMemo["prepend"] +
                          account +
                          gatewayStatus[selectedGateway].fixedMemo["append"]
                },
                fetchingAddress: false
            });
        } else {
            if (!depositAddress) {
                const assetName =
                    backingAsset.backingCoinType || backingAsset.backingCoin;
                const fullAssetName = backingAsset.symbol;

                requestDepositAddress(
                    this._getDepositObject(
                        assetName,
                        fullAssetName,
                        selectedGateway,
                        gatewayStatus[selectedGateway].baseAPI.BASE
                    )
                );
            } else {
                this.setState({
                    depositAddress,
                    fetchingAddress: false
                });
            }
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
            selectedGateway.toLowerCase(),
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
        let isAddressValid =
            depositAddress &&
            depositAddress !== "unknown" &&
            !depositAddress.error;

        let minDeposit = 0;
        if (!!backingAsset) {
            if (!!backingAsset.minAmount && !!backingAsset.precision) {
                minDeposit = utils.format_number(
                    backingAsset.minAmount /
                        utils.get_asset_precision(backingAsset.precision),
                    backingAsset.precision,
                    false
                );
            } else if (!!backingAsset.gateFee) {
                minDeposit = backingAsset.gateFee * 2;
            }
        }
        //let maxDeposit = backingAsset.maxAmount ? backingAsset.maxAmount : null;

        const QR = isAddressValid ? (
            <CryptoLinkFormatter
                size={140}
                address={usingGateway ? depositAddress.address : account}
                asset={selectedAsset}
            />
        ) : (
            <div>
                <Icon
                    size="5x"
                    name="minus-circle"
                    title="icons.minus_circle.wrong_address"
                />
                <p className="error-msg">
                    <Translate content="modal.deposit.address_generation_error" />
                </p>
            </div>
        );

        return (
            <div className="grid-block vertical no-overflow">
                <div className="modal__body" style={{paddingTop: "0"}}>
                    <div className="container-row">
                        <div className="no-margin no-padding">
                            <div className="inline-label input-wrapper">
                                <DepositWithdrawAssetSelector
                                    defaultValue={this.state.selectedAsset}
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
                                gatewayStatus[selectedGateway].options
                                    .enabled)) &&
                        isAddressValid &&
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
                            style={{textAlign: "center", paddingTop: 15}}
                        >
                            <LoadingIndicator type="three-bounce" />
                        </div>
                    )}
                    {selectedGateway &&
                    gatewayStatus[selectedGateway].options.enabled &&
                    isAddressValid ? (
                        <div className="container-row">
                            <Translate
                                className="grid-block container-row maxDeposit"
                                style={{fontSize: "1rem"}}
                                content="gateway.min_deposit_warning_amount"
                                minDeposit={minDeposit || 0}
                                coin={selectedAsset}
                            />

                            <div className="grid-block container-row">
                                <div style={{paddingRight: "1rem"}}>
                                    <CopyButton
                                        text={depositAddress.address}
                                        className={"copyIcon"}
                                    />
                                </div>
                                <div style={{wordBreak: "break-word"}}>
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
                                    <div
                                        className="modal__highlight"
                                        style={{
                                            fontSize: "0.9rem",
                                            wordBreak: "break-all"
                                        }}
                                    >
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
                                        <div
                                            className="modal__highlight"
                                            style={{wordBreak: "break-all"}}
                                        >
                                            {depositAddress.memo}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            <Translate
                                component="span"
                                style={{fontSize: "0.8rem"}}
                                content="gateway.min_deposit_warning_asset"
                                minDeposit={minDeposit || 0}
                                coin={selectedAsset}
                            />
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
            this.props.hideModal();
        });
    }

    onClose() {
        this.props.hideModal();
        this.setState({open: false});
    }

    render() {
        return (
            <Modal
                title={
                    this.props.account
                        ? counterpart.translate("modal.deposit.header", {
                              account_name: this.props.account
                          })
                        : counterpart.translate("modal.deposit.header_short")
                }
                id={this.props.modalId}
                className={this.props.modalId}
                onCancel={this.onClose.bind(this)}
                overlay={true}
                footer={[
                    <Button key="cancel" onClick={this.props.hideModal}>
                        {counterpart.translate("modal.close")}
                    </Button>
                ]}
                visible={this.props.visible}
                noCloseBtn
            >
                <DepositModalContent
                    hideModal={this.props.hideModal}
                    {...this.props}
                    open={this.props.visible}
                />
            </Modal>
        );
    }
}
