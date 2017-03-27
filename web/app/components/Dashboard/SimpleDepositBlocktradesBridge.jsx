import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import { Asset } from "common/MarketClasses";
import utils from "common/utils";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import ReactTooltip from "react-tooltip";
import counterpart from "counterpart";
import {requestDepositAddress, validateAddress, WithdrawAddresses, getDepositLimit, estimateOutput} from "common/blockTradesMethods";
import BlockTradesDepositAddressCache from "common/BlockTradesDepositAddressCache";
import CopyButton from "../Utility/CopyButton";
import Icon from "../Icon/Icon";
import LoadingIndicator from "../LoadingIndicator";
import {blockTradesAPIs} from "api/apiConfig";
import FloatingDropdown from "../Utility/FloatingDropdown";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";

// import DepositFiatOpenLedger from "components/DepositWithdraw/openledger/DepositFiatOpenLedger";
// import WithdrawFiatOpenLedger from "components/DepositWithdraw/openledger/WithdrawFiatOpenLedger";

class SimpleDepositBlocktradesBridge extends React.Component {

    static propTypes = {
        sender: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired
    };

    constructor(props) {
        super();
        this.state = {
            toAddress: WithdrawAddresses.getLast(props.walletType),
            withdrawValue:"",
            amountError: null,
            inputAmount: 1,
            receiveLoading: true,
            limitLoading: true
        };

        this._validateAddress(this.state.toAddress, props);

        this.deposit_address_cache = new BlockTradesDepositAddressCache();
        this.addDepositAddress = this.addDepositAddress.bind(this);
    }

    componentWillMount() {
        this._getDepositAddress();
    }

    componentDidMount() {
        this._getDepositLimit();
        this._estimateOutput();
    }

    componentWillReceiveProps(np) {
        if (np.inputCoinType !== this.props.inputCoinType || np.outputCoinType !== this.props.outputCoinType) {
            this._getDepositLimit(np);
            this._estimateOutput(np);
            this._getDepositAddress(np);
        }
    }

    _getDepositLimit(props = this.props) {
        this.setState({limitLoading: true});
        getDepositLimit(props.inputCoinType, props.outputCoinType).then(res => {
            this.setState({
                depositLimit: res.depositLimit,
                limitLoading: false
            });
        }).catch(err => {
            console.log("deposit limit error:", err);
            this.setState({
                depositLimit: null,
                limitLoading: false
            });
        });
    }

    _estimateOutput(props = this.props) {
        this.setState({receiveLoading: true});
        estimateOutput(this.state.inputAmount, props.inputCoinType, props.outputCoinType).then(res => {
            this.setState({
                receiveAmount: parseFloat(res.outputAmount),
                receiveLoading: false
            });
        }).catch(err => {
            console.log("receive amount err:", err);
            this.setState({receiveLoading: false, receiveAmount: null});
        });
    }

    _getDepositAddress(props = this.props) {
        if (!props.inputCoinType) return;
        let account_name = props.sender.get("name");
        let receive_address = this.deposit_address_cache.getCachedInputAddress(
            "blocktrades",
            account_name,
            props.inputCoinType.toLowerCase(),
            props.outputCoinType.toLowerCase()
        );
        if (!receive_address) {
            this.setState({receive_address: null});
            requestDepositAddress(this._getDepositObject());
        } else {
            this.setState({
                receive_address
            });
        }
    }

    _getDepositObject() {
        return {
            inputCoinType: this.props.inputCoinType.toLowerCase(),
            outputCoinType: this.props.outputCoinType.toLowerCase(),
            outputAddress: this.props.sender.get("name"),
            url: blockTradesAPIs.BASE,
            stateCallback: this.addDepositAddress
        };
    }

    addDepositAddress( receive_address ) {
        let account_name = this.props.sender.get("name");
        this.deposit_address_cache.cacheInputAddress(
            "blocktrades",
            account_name,
            this.props.inputCoinType.toLowerCase(),
            this.props.outputCoinType.toLowerCase(),
            receive_address.address,
            receive_address.memo
        );
        this.setState({
            receive_address
        });
    }

    componentDidUpdate() {
        ReactTooltip.rebuild();
    }

    _validateAddress(address, props = this.props) {
        validateAddress({walletType: props.walletType, newAddress: address})
            .then(isValid => {
                if (this.state.toAddress === address) {
                    this.setState({
                        withdraw_address_check_in_progress: false,
                        validAddress: isValid
                    });
                }
            }).catch(err => {
                console.error("Error when validating address:", err);
            });
    }

    _openRegistrarSite(e) {
        e.preventDefault();
        let newWnd = window.open(SettingsStore.site_registr, "_blank");
        newWnd.opener = null;
    }

    _onInputAmount(e) {
        this.setState({inputAmount: parseFloat(e.target.value)}, this._estimateOutput.bind(this));
    }

    _onDropDownSelect(e) {
        SettingsActions.changeViewSetting({preferredBridge: e});
    }

    _renderDeposit() {
        const {name: assetName, prefix} = utils.replaceName(this.props.asset.get("symbol"), !!this.props.asset.get("bitasset"));
        const {receive_address} = this.state;
        const hasMemo = receive_address && "memo" in receive_address && receive_address.memo;
        const addressValue = receive_address && receive_address.address || "";
        let tabIndex = 1;

        let bridgeAssets = Object.keys(this.props.bridges.toJS());

        const inputName = this.props.inputCoinType.toUpperCase();
        const receiveName = (prefix ? prefix : "") + assetName;

        let price = receiveName === "BTS" && inputName === "BTC" ? (this.state.inputAmount / this.state.receiveAmount).toFixed(8) :
            (this.state.receiveAmount / this.state.inputAmount).toFixed(4);
        let priceSuffix = receiveName === "BTS" && inputName === "BTC" ? inputName +"/" + receiveName :
            receiveName +"/" + inputName;

        const aboveLimit = this.state.inputAmount > parseFloat(this.state.depositLimit);

        return (
            <div className={!addressValue ? "no-overflow" : ""}>
                <p><Translate unsafe content="gateway.purchase_1" inputAsset={inputName} outputAsset={receiveName} />.</p>

                {this._renderCurrentBalance()}

                <div className="SimpleTrade__withdraw-row">

                    <div className="no-margin no-padding">
                        <div className="small-6" style={{paddingRight: 10}}>
                            <label className="left-label"><Translate content="transfer.send" /></label>
                            <div className="inline-label input-wrapper">
                                <input type="number" defaultValue={1} onChange={this._onInputAmount.bind(this)}/>
                                <div className="form-label select floating-dropdown">
                                    <FloatingDropdown
                                        entries={bridgeAssets}
                                        values={bridgeAssets.reduce((map, a) => {if (a) map[a] = a; return map;}, {})}
                                        singleEntry={bridgeAssets[0]}
                                        value={this.props.preferredBridge || bridgeAssets[0]}
                                        onChange={this._onDropDownSelect}
                                        upperCase
                                    />
                                </div>
                                {/* <div className="input-right-symbol">{inputName}</div> */}
                            </div>
                        </div>

                        <div className="small-6" style={{paddingLeft: 10}}>
                            <label className="left-label"><Translate content="exchange.receive" /></label>
                            <div className="inline-label input-wrapper">
                                <input disabled type="number" value={this.state.receiveAmount || 0}/>
                                <div className="input-right-symbol">{receiveName}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="SimpleDepositBridge__info-row">
                    <div><Translate content="exchange.price" />: <div className="float-right">{this.state.receiveLoading ? <Translate content="footer.loading" /> : <span>{price} {priceSuffix}</span>}</div></div>
                    <div>
                        <Translate content="gateway.deposit_limit" />:
                        <div className={"float-right" + (aboveLimit ? " above-limit" : "")}>
                            {this.state.limitLoading ?
                                <Translate content="footer.loading" /> :
                                <span>{this.state.depositLimit && parseFloat(this.state.depositLimit).toFixed(4)} {inputName}</span>
                            }
                        </div>
                    </div>
                </div>

                <div className="SimpleTrade__withdraw-row">
                    <p style={{marginBottom: 10}} data-place="right" data-tip={counterpart.translate("tooltip.deposit_tip", {asset: inputName})}>
                        <Translate className="help-tooltip" content="gateway.deposit_to" asset={inputName} />:
                    </p>
                    {!addressValue ? <LoadingIndicator type="three-bounce"/> :<label>
                        <span className="inline-label">
                            <input readOnly type="text" value={addressValue} />
                            <CopyButton
                                text={addressValue}
                            />
                        </span>
                    </label>}
                    {hasMemo ?
                        <label>
                            <span className="inline-label">
                                <input readOnly type="text" value={counterpart.translate("transfer.memo") + ": " + receive_address.memo} />
                                <CopyButton
                                    text={receive_address.memo}
                                />
                            </span>
                        </label> : null}


                    {receive_address && receive_address.error ?
                        <div className="has-error" style={{paddingTop: 10}}>
                            {receive_address.error.message}
                        </div> : null}
                </div>

                <div className="button-group SimpleTrade__withdraw-row">
                    <button tabIndex={tabIndex++} className="button" onClick={requestDepositAddress.bind(null, this._getDepositObject())} type="submit" >
                        <Translate content="gateway.generate_new" />
                    </button>
                </div>
            </div>
        );
    }

    _renderCurrentBalance() {
        const {name: assetName} = utils.replaceName(this.props.asset.get("symbol"), !!this.props.asset.get("bitasset"));
        const isDeposit = this.props.action === "deposit";

        let currentBalance = this.props.balances.find(b => {
            return b && b.get("asset_type") === this.props.asset.get("id");
        });

        let asset = currentBalance ? new Asset({
            asset_id: currentBalance.get("asset_type"),
            precision: this.props.asset.get("precision"),
            amount: currentBalance.get("balance")
        }) : null;

        const applyBalanceButton = isDeposit ?
            <span style={{border: "2px solid black", borderLeft: "none"}} className="form-label">{assetName}</span> :
        (
            <button
                data-place="right" data-tip={counterpart.translate("tooltip.withdraw_full")}
                className="button"
                style={{border: "2px solid black", borderLeft: "none"}}
                onClick={this._updateAmount.bind(this, !currentBalance ? 0 : parseInt(currentBalance.get("balance"), 10))}
            >
                <Icon name="clippy" />
            </button>
        );

        return (
            <div className="SimpleTrade__withdraw-row" style={{fontSize: "1rem"}}>
                <label style={{fontSize: "1rem"}}>
                    {counterpart.translate("gateway.balance_asset", {asset: assetName})}:
                    <span className="inline-label">
                        <input
                            disabled
                            style={{color: "black", border: "2px solid black", padding: 10, width: "100%"}}
                            value={!asset ? 0 : asset.getAmount({real: true})}
                        />
                        {applyBalanceButton}
                    </span>
                </label>
            </div>
        );
    }

    render() {
        let {asset} = this.props;

        if (!asset) {
            return null;
        }

        const {name: assetName, prefix} = utils.replaceName(asset.get("symbol"), !!asset.get("bitasset"));

        return (
            <div className="SimpleTrade__modal">
                <div className="Modal__header">
                    <h3><Translate content={"gateway.purchase"} asset={(prefix ? prefix : "") + assetName} /></h3>
                </div>
                <div className="Modal__divider"></div>

                <div
                    className="grid-block vertical no-overflow"
                    style={{
                        zIndex: 1002,
                        paddingLeft: "2rem",
                        paddingRight: "2rem",
                        paddingTop: "1rem"
                    }}>

                    {this._renderDeposit()}
                </div>
            </div>
        );
    }
}
SimpleDepositBlocktradesBridge = BindToChainState(SimpleDepositBlocktradesBridge);

class StoreWrapper extends React.Component {
    render() {
        let {preferredBridge, ...others} = this.props;
        let currentBridge = this.props.bridges.get(this.props.preferredBridge);
        if (!currentBridge) {
            currentBridge = this.props.bridges.first();
            preferredBridge = currentBridge.inputCoinType;
        }
        return <SimpleDepositBlocktradesBridge {...others} preferredBridge={preferredBridge} {...currentBridge.toJS()} />;
    }
}

StoreWrapper = connect(StoreWrapper, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            preferredBridge: SettingsStore.getState().viewSettings.get("preferredBridge", "btc")
        };
    }
});

export default class SimpleDepositBlocktradesBridgeModal extends React.Component {
    constructor() {
        super();

        this.state = {
            open: false
        };
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
        if (!this.props.bridges) return null;

        return (
            <Modal className="test" onClose={this.onClose.bind(this)} id={this.props.modalId} overlay={true}>
                <Trigger close={this.props.modalId}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                {this.state.open ? <StoreWrapper {...this.props} open={this.state.open} /> : null}
            </Modal>
        );
    }
}
