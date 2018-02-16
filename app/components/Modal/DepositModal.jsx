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
                OPEN: { id: "OPEN", name: "OPENLEDGER", enabled: false, selected: false, support_url: "https://wallet.bitshares.org/#/help/gateways/openledger" },
                RUDEX: { id: "RUDEX", name: "RUDEX", enabled: false, selected: false, support_url: "https://wallet.bitshares.org/#/help/gateways/rudex" }
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

        if(!asset) return;

        let backedAsset = asset.split(".");
        let usingGateway = this.state.gatewayStatus[backedAsset[0]] ? true : false;

        if(usingGateway) {
            let assetName = backedAsset[1];
            let assetGateway = backedAsset[0];
            this._getDepositAddress(assetName, assetGateway);
        } else {
            this.setState({ selectedAsset: "BTS" });
        }
    }

    shouldComponentUpdate(np, ns) {
        return(!utils.are_equal_shallow(ns, this.state));
    }

    onGatewayChanged(e) {
        if(!e.target.value) return;
        this._getDepositAddress(this.state.selectedAsset, e.target.value);
    }

    onAssetSelected(selectedAsset) {
        // Preselect gateway on single choise
        let gatewayStatus = this._getAvailableGateways(selectedAsset);
        let selectedGateway = null;
        let nAvailable = 0;

        for(let g in gatewayStatus) { if(gatewayStatus[g].enabled) { nAvailable++; } }
        if(nAvailable == 1) { for(let g in gatewayStatus) { if(gatewayStatus[g].enabled) { selectedGateway = g; } } }

        // Fetch address if we have a selected gateway
        if(selectedGateway) { this._getDepositAddress(selectedAsset, selectedGateway); }
        else {
            this.setState({
                selectedAsset,
                selectedGateway,
                backingAsset: null,
                gatewayStatus
            });
        }
    }

    _getAvailableGateways(selectedAsset) {
        let {gatewayStatus} = this.state;

        for (let g in gatewayStatus) { gatewayStatus[g].enabled = false; }

        for (let g in gatewayStatus) {
            this.props.backedCoins.get(g.toUpperCase(), []).find(c => {
                if(g == "OPEN" && selectedAsset == c.backingCoinType && c.depositAllowed && c.isAvailable) { gatewayStatus.OPEN.enabled = true; }
                if(g == "RUDEX" && selectedAsset == c.backingCoin && c.depositAllowed) { gatewayStatus.RUDEX.enabled = true; }
            });
        }
        return gatewayStatus;
    }

    _getDepositAddress(selectedAsset, selectedGateway) {
        let {account} = this.props;

        this.setState({
            fetchingAddress: true,
            depositAddress: null,
            gatewayStatus: this._getAvailableGateways(selectedAsset)
        });

        // Get Backing Asset for Gateway
        let backingAsset = this.props.backedCoins.get(selectedGateway.toUpperCase(), []).find(c => {
            return c.backingCoinType === selectedAsset || c.backingCoin === selectedAsset;
        });

        if(!backingAsset) {
            //console.log(selectedGateway + " does not support " + selectedAsset);
            this.setState({
                depositAddress: null,
                selectedAsset,
                selectedGateway,
                fetchingAddress: false
            });
            return;
        }

        if(selectedGateway == "OPEN") {
            this.setState({
                isOpenledger: true
            });
            let depositAddress = this.deposit_address_cache.getCachedInputAddress(
                selectedGateway.toUpperCase(),
                account,
                selectedAsset.toLowerCase(),
                selectedGateway.toLowerCase() + "." + selectedAsset.toLowerCase(),
            );
            if(!depositAddress) {
                requestDepositAddress({
                    inputCoinType: selectedAsset.toLowerCase(),
                    outputCoinType: "open." + selectedAsset.toLowerCase(),
                    outputAddress: account,
                    stateCallback: this.addDepositAddress
                });
            } else {
                this.setState({
                    depositAddress,
                    fetchingAddress: false,
                });
            }
        } else if(selectedGateway == "RUDEX") {
            this.setState({
                depositAddress: {
                    address: backingAsset.gatewayWallet,
                    memo: "dex:" + account,
                },
                fetchingAddress: false,
                isOpenledger: false
            });
        } else {
            console.log("Withdraw Modal Error: Unknown Gateway " + selectedGateway + " for asset " + selectedAsset);
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

    _openGatewaySite() {
        let {selectedGateway, gatewayStatus} = this.state;
        let win = window.open(gatewayStatus[selectedGateway].support_url, "_blank");
        win.focus();
    }

    render() {
        let {selectedAsset, selectedGateway, depositAddress, fetchingAddress, gatewayStatus, backingAsset} = this.state;
        let {account} = this.props;
        let usingGateway = true;

        if(selectedGateway == null && selectedAsset == "BTS") {
            usingGateway = false;
            depositAddress = { address: account };
        }

        // Count available gateways
        let nAvailableGateways = 0;
        for (let g in gatewayStatus) {
            this.props.backedCoins.get(g.toUpperCase(), []).find(c => {
                if(g == "OPEN" && selectedAsset == c.backingCoinType && c.depositAllowed && c.isAvailable) { nAvailableGateways++; }
                if(g == "RUDEX" && selectedAsset == c.backingCoin && c.depositAllowed) { nAvailableGateways++; }
            });
        }

        const QR = depositAddress && depositAddress.address && !depositAddress.error ?
            <div className="QR"><QRCode size={140} value={depositAddress.address}/></div> :
            <div>
                <Icon size="5x" name="minus-circle" />
                <p className="error-msg">
                    <Translate content="modal.deposit.address_generation_error" />
                </p>
            </div>;

        const logo = require("assets/logo-ico-blue.png");

        //console.log(selectedAsset + " w/ " + selectedGateway + " ", backingAsset, depositAddress);

        return (
            <div className="DepositModal">
                <div className="canvas grid-block vertical no-overflow">
                    <div className="Modal__header">
                        <img src={logo} /><br />
                        <p>
                            {usingGateway && account ?
                                <Translate content="modal.deposit.header" account_name={<span className="send-name">{account}</span>} />
                                : <Translate content="modal.deposit.header_short" />
                            }
                        </p>
                    </div>
                    <div className="Modal__body">
                        <div className="container-row">
                            <div className="no-margin no-padding">
                                <div className="inline-label input-wrapper">
                                    <DepositWithdrawAssetSelector
                                        defaultValue={selectedAsset}
                                        onSelect={this.onAssetSelected.bind(this)}
                                        selectOnBlur />
                                </div>
                            </div>
                        </div>
                        {usingGateway && selectedAsset ?
                            <div className="container-row">
                                <div className="no-margin no-padding">
                                    <section className="block-list">
                                        <label className="left-label"><Translate content="modal.deposit.gateway" />
                                            {selectedGateway ? <span style={{cursor: "pointer"}}>&nbsp;<Icon name="question-circle" onClick={this._openGatewaySite.bind(this)}/></span> : null}
                                            <span className="floatRight error-msg">
                                                {selectedGateway && !gatewayStatus[selectedGateway].enabled ? <Translate content="modal.deposit.disabled" /> : null}
                                                {depositAddress && depositAddress.error ? <Translate content="modal.deposit.wallet_error" /> : null}
                                                {!selectedGateway && nAvailableGateways == 0 ? <Translate content="modal.deposit.no_gateway_available" /> : null}
                                            </span>
                                        </label>

                                        <div className="inline-label input-wrapper">
                                            <select role="combobox" className="selectWrapper" value={!selectedGateway ? "" : selectedGateway} onChange={this.onGatewayChanged.bind(this)}>
                                                {!selectedGateway && nAvailableGateways != 0 ? <Translate component="option" value="" content="modal.deposit.select_gateway" /> : null}
                                                {gatewayStatus.RUDEX.enabled ? <option value="RUDEX">{gatewayStatus.RUDEX.name}</option> : null}
                                                {gatewayStatus.OPEN.enabled ? <option value="OPEN">{gatewayStatus.OPEN.name}</option> : null}
                                            </select>
                                            <Icon name="chevron-down" style={{position: "absolute", right: "10px", top: "10px"}} />
                                        </div>
                                    </section>
                                </div>
                            </div> : null}
                        {!fetchingAddress ?
                            (!usingGateway || (usingGateway && selectedGateway && gatewayStatus[selectedGateway].enabled)) && depositAddress && !depositAddress.memo ?
                                <div className="container-row" style={{textAlign: "center"}}>{QR}</div> :
                                null :
                            <div className="container-row" style={{textAlign: "center"}}><LoadingIndicator type="three-bounce" /></div>
                        }
                        {selectedGateway && gatewayStatus[selectedGateway].enabled && depositAddress && !depositAddress.error ?
                            <div className="container-row deposit-info" style={{textAlign: "center"}}>

                                {backingAsset.minAmount ?
                                    <div className="grid-block container-row maxDeposit">
                                        <Translate
                                            content="gateway.rudex.min_amount"
                                            minAmount={utils.format_number(backingAsset.minAmount / utils.get_asset_precision(backingAsset.precision), backingAsset.precision, false)}
                                            symbol={selectedAsset} />
                                    </div>
                                : null }
                                {this.state.isOpenledger && 
                                    <Translate className="grid-block container-row maxDeposit" component="div" content="gateway.min_deposit_warning_amount" minDeposit={backingAsset.gateFee * 2 || 0} coin={selectedAsset}/>
                                }
                
                                 
                                <div className="grid-block container-row deposit-details">
                                    <div className="copyIcon">
                                        <CopyButton text={depositAddress.address} className={"copyIcon"} />
                                    </div>
                                    <div>
                                        <div><Translate content="gateway.purchase_notice" inputAsset={selectedAsset} outputAsset={selectedGateway + "." + selectedAsset} /></div>
                                        <div>{depositAddress.address}</div>
                                    </div>
                                </div>
                                {depositAddress.memo ?
                                    <div className="grid-block container-row deposit-details">
                                        <div className="copyIcon">
                                            <CopyButton text={depositAddress.memo} className={"copyIcon"} />
                                        </div>
                                        <div>
                                            <div><Translate unsafe content="gateway.purchase_notice_memo" /></div>
                                            <div>{depositAddress.memo}</div>
                                        </div>
                                    </div>
                                : null}
                            </div>
                        : null}
                        {!usingGateway ?
                            <div className="container-row deposit-directly">
                                <p><span className="send-name">{account}</span></p>
                                <p>
                                    <Translate content="modal.deposit.bts_transfer_description" />
                                </p>
                            </div>
                        : null}
                    </div>
                    {this.state.isOpenledger && 
                        <Translate className="fz_12" component="p" content="gateway.min_deposit_warning_asset" minDeposit={backingAsset.gateFee * 2 || 0} coin={selectedAsset}/>
                    }
                
                    <div className="Modal__footer">
                        <div className="container-row" style={{paddingBottom: 35}}>
                            <button className="ActionButton_Close" style={{width: "100%"}} onClick={this.onClose.bind(this)}>
                                <Translate content="modal.deposit.close" />
                            </button>
                        </div>
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
        return (
            this.state.open ?
            <BaseModal style={{maxWidth: 500}} className={this.props.modalId} onClose={this.onClose.bind(this)} overlay={true} id={this.props.modalId}>
                <DepositModalContent {...this.props} open={this.state.open} />
            </BaseModal> : null
        );
    }
}
