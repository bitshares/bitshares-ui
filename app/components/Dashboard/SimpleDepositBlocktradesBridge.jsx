import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "../Modal/BaseModal";
import Translate from "react-translate-component";
import {Asset} from "common/MarketClasses";
import utils from "common/utils";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import ReactTooltip from "react-tooltip";
import counterpart from "counterpart";
import {
    requestDepositAddress,
    validateAddress,
    WithdrawAddresses,
    getDepositLimit,
    estimateOutput,
    estimateInput
} from "common/gatewayMethods";
import BlockTradesDepositAddressCache from "common/BlockTradesDepositAddressCache";
import CopyButton from "../Utility/CopyButton";
import Icon from "../Icon/Icon";
import LoadingIndicator from "../LoadingIndicator";
import {blockTradesAPIs} from "api/apiConfig";
import FloatingDropdown from "../Utility/FloatingDropdown";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import QRCode from "qrcode.react";

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
            withdrawValue: "",
            amountError: null,
            inputAmount: 0,
            receiveLoading: false,
            limitLoading: true,
            apiError: false
        };

        this._validateAddress(this.state.toAddress, props);

        this.deposit_address_cache = new BlockTradesDepositAddressCache();
    }

    onClose() {
        ZfApi.publish(this.props.modalId, "close");
    }

    componentWillMount() {
        this._getDepositAddress();
    }

    componentDidMount() {
        this._getDepositLimit();
        this._estimateOutput();
    }

    componentWillReceiveProps(np) {
        if (
            np.inputCoinType !== this.props.inputCoinType ||
            np.outputCoinType !== this.props.outputCoinType
        ) {
            this._getDepositLimit(np);
            this._estimateOutput(np);
            this._getDepositAddress(np);
        }
    }

    shouldComponentUpdate(np, ns) {
        return (
            np.inputCoinType !== this.props.inputCoinType ||
            np.outputCoinType !== this.props.outputCoinType ||
            np.sender !== this.props.sender ||
            np.asset !== this.props.asset ||
            np.isAvailable !== this.props.isAvailable ||
            np.isDown !== this.props.isDown ||
            !utils.are_equal_shallow(ns, this.state)
        );
    }

    _getDepositLimit(props = this.props) {
        this.setState({limitLoading: true});
        getDepositLimit(props.inputCoinType, props.outputCoinType)
            .then(res => {
                this.setState({
                    depositLimit: res.depositLimit,
                    limitLoading: false
                });
            })
            .catch(err => {
                console.log("deposit limit error:", err);
                this.setState({
                    depositLimit: null,
                    limitLoading: false
                });
            });
    }

    _onAmountChange(value, e) {
        const regexp_numeral = new RegExp(/[[:digit:]]/);
        const target = e.target;

        // Ensure input is valid
        if (!regexp_numeral.test(target.value)) {
            target.value = target.value.replace(/[^0-9.]/g, "");
        }

        // Catch initial decimal input
        if (target.value.charAt(0) == ".") {
            target.value = "0.";
        }

        // Catch double decimal and remove if invalid
        if (
            target.value.charAt(target.value.length) != target.value.search(".")
        ) {
            target.value.substr(1);
        }

        target.value = utils.limitByPrecision(target.value, 8);

        switch (value) {
            case "input":
                this.setState(
                    {inputAmount: target.value},
                    this._estimateOutput.bind(this)
                );
                break;

            case "output":
                this.setState(
                    {outputAmount: target.value},
                    this._estimateInput.bind(this)
                );
                break;
        }
    }

    _estimateOutput(props = this.props) {
        this.setState({receiveAmount: 0, sendAmount: this.state.inputAmount});
        if (!this.state.inputAmount) {
            return;
        }

        this.setState({receiveLoading: true});
        estimateOutput(
            this.state.inputAmount,
            props.inputCoinType,
            props.outputCoinType
        )
            .then(res => {
                this.setState({
                    inputAmount: res.inputAmount,
                    receiveAmount: res.outputAmount,
                    receiveLoading: false
                });
            })
            .catch(err => {
                console.log("receive amount err:", err);
                this.setState({receiveLoading: false, apiError: true});
            });
    }

    _estimateInput(props = this.props) {
        this.setState({receiveAmount: this.state.outputAmount, sendAmount: 0});
        if (!this.state.outputAmount) {
            return;
        }

        this.setState({receiveLoading: true});
        estimateInput(
            this.state.outputAmount,
            props.inputCoinType,
            props.outputCoinType
        )
            .then(res => {
                this.setState({
                    inputAmount: res.inputAmount,
                    sendAmount: utils.limitByPrecision(res.inputAmount, 8),
                    receiveLoading: false
                });
            })
            .catch(err => {
                console.log("send amount err:", err);
                this.setState({receiveLoading: false, apiError: true});
            });
    }

    _getDepositAddress(props = this.props) {
        if (!props.inputCoinType) return;
        let receive_address;

        /* Always generate new address/memo for increased security */
        /*let account_name = props.sender.get("name");
        let receive_address = this.deposit_address_cache.getCachedInputAddress(
            "blocktrades",
            account_name,
            props.inputCoinType.toLowerCase(),
            props.outputCoinType.toLowerCase()
        );*/
        if (!receive_address) {
            this.setState({receive_address: null});
            requestDepositAddress(this._getDepositObject(props));
        } else {
            this.setState({
                receive_address
            });
        }
    }

    _getDepositObject(props = this.props) {
        return {
            inputCoinType: props.inputCoinType.toLowerCase(),
            outputCoinType: props.outputCoinType.toLowerCase(),
            outputAddress: props.sender.get("name"),
            url: blockTradesAPIs.BASE,
            stateCallback: receive_address => {
                this.addDepositAddress(
                    props.inputCoinType.toLowerCase(),
                    props.outputCoinType.toLowerCase(),
                    props.sender.get("name"),
                    receive_address
                );
            }
        };
    }

    addDepositAddress(
        input_coin_type,
        output_coin_type,
        account,
        receive_address
    ) {
        this.deposit_address_cache.cacheInputAddress(
            "blocktrades",
            account,
            input_coin_type,
            output_coin_type,
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
            })
            .catch(err => {
                console.error("Error when validating address:", err);
            });
    }

    _openRegistrarSite(e) {
        e.preventDefault();
        let newWnd = window.open(SettingsStore.site_registr, "_blank");
        newWnd.opener = null;
    }

    _onDropDownSelect(e) {
        SettingsActions.changeViewSetting({preferredBridge: e});
    }

    onBlockTradesContact() {
        console.log("Open New Tab");
        let win = window.open("https://www.blocktrades.us/contact", "_blank");
        win.focus();
    }

    _renderDeposit() {
        const {name: assetName, prefix} = utils.replaceName(this.props.asset);
        const {receive_address, apiError} = this.state;
        const hasMemo =
            receive_address &&
            "memo" in receive_address &&
            receive_address.memo;
        const addressValue = (receive_address && receive_address.address) || "";
        const QR = (
            <div className="QR" style={{textAlign: "center"}}>
                <QRCode size={140} value={addressValue} />
            </div>
        );

        let bridgeAssets = Object.keys(this.props.bridges.toJS());

        const inputName = this.props.inputCoinType.toUpperCase();
        const receiveName = (prefix ? prefix : "") + assetName;

        let price = (this.state.receiveAmount / this.state.inputAmount).toFixed(
            4
        );
        let priceSuffix = receiveName + "/" + inputName;

        const aboveLimit =
            this.state.inputAmount > parseFloat(this.state.depositLimit) ||
            this.state.sendAmount > parseFloat(this.state.depositLimit);
        const aboveLimitStyle = aboveLimit
            ? {border: "1px solid #a94442"}
            : null;

        return (
            <div className="modal__body">
                <div className="container-row">
                    <label className="left-label">
                        <Translate content="modal.buy.asset" />
                    </label>
                    <div className="inline-label input-wrapper">
                        <input
                            disabled
                            type="text"
                            defaultValue={receiveName}
                        />
                    </div>
                </div>
                <div className="container-row">
                    <div className="grid-block">
                        <label className="left-label">
                            <Translate content="modal.buy.bridge" />
                        </label>
                        <span
                            data-tip={counterpart.translate(
                                "tooltip.bridge_TRADE"
                            )}
                            className="inline-block tooltip"
                            onClick={this.onBlockTradesContact.bind(this)}
                        >
                            &nbsp;<Icon
                                style={{position: "relative", top: 0}}
                                name="question-circle"
                            />
                        </span>
                    </div>
                    <div className="inline-label input-wrapper">
                        <input
                            disabled
                            type="text"
                            defaultValue={"BLOCKTRADES"}
                        />{" "}
                        {/* Change this when we gain more brdiges */}
                    </div>
                </div>
                <span style={!apiError ? {display: ""} : {display: "none"}}>
                    <div className="container-row double-row">
                        <div className="no-margin no-padding">
                            <div className="small-6" style={{paddingRight: 10}}>
                                <div className="grid-block">
                                    <label className="left-label">
                                        <Translate content="transfer.send" />
                                    </label>
                                    {aboveLimit ? (
                                        <div
                                            className="error-msg inline-block tooltip"
                                            data-tip={counterpart.translate(
                                                "tooltip.over_limit"
                                            )}
                                        >
                                            <Translate content="gateway.over_limit" />&nbsp;<Icon name="question-circle" />
                                        </div>
                                    ) : null}
                                </div>
                                <div className="inline-label input-wrapper">
                                    <input
                                        style={aboveLimitStyle}
                                        type="text"
                                        value={this.state.sendAmount}
                                        onInput={this._onAmountChange.bind(
                                            this,
                                            "input"
                                        )}
                                    />
                                    <div className="form-label select floating-dropdown">
                                        <FloatingDropdown
                                            entries={bridgeAssets}
                                            values={bridgeAssets.reduce(
                                                (map, a) => {
                                                    if (a) map[a] = a;
                                                    return map;
                                                },
                                                {}
                                            )}
                                            singleEntry={bridgeAssets[0]}
                                            value={
                                                this.props.preferredBridge ||
                                                bridgeAssets[0]
                                            }
                                            onChange={this._onDropDownSelect}
                                            upperCase
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="small-6" style={{paddingLeft: 10}}>
                                <label className="left-label">
                                    <Translate content="gateway.deposit_limit" />
                                </label>
                                <div className="inline-label input-wrapper">
                                    <input
                                        disabled
                                        type="number"
                                        value={
                                            (this.state.depositLimit &&
                                                parseFloat(
                                                    this.state.depositLimit
                                                ).toFixed(4)) ||
                                            0
                                        }
                                    />
                                    <div className="input-right-symbol">
                                        {inputName}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container-row double-row">
                        <div className="no-margin no-padding">
                            <div className="small-6" style={{paddingRight: 10}}>
                                <label className="left-label">
                                    <Translate content="exchange.receive" />
                                </label>
                                <div className="inline-label input-wrapper">
                                    <input
                                        style={aboveLimitStyle}
                                        type="text"
                                        value={this.state.receiveAmount}
                                        onInput={this._onAmountChange.bind(
                                            this,
                                            "output"
                                        )}
                                    />
                                    <div className="input-right-symbol">
                                        {receiveName}
                                    </div>
                                </div>
                            </div>
                            <div className="small-6" style={{paddingLeft: 10}}>
                                <div className="grid-block">
                                    <label className="left-label">
                                        <Translate content="exchange.price" />
                                        &nbsp;&nbsp;{this.state
                                            .receiveLoading ? (
                                            <Translate content="footer.loading" />
                                        ) : (
                                            ""
                                        )}
                                    </label>
                                </div>
                                <div className="inline-label input-wrapper">
                                    <input
                                        disabled
                                        type="number"
                                        value={aboveLimit ? 0 : price}
                                    />
                                    <div className="input-right-symbol">
                                        {priceSuffix}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {!addressValue ? (
                        <div style={{textAlign: "center"}}>
                            <LoadingIndicator type="three-bounce" />
                        </div>
                    ) : (
                        <div className="container-row">
                            {hasMemo ? null : QR}
                            <div className="grid-block">
                                <div className="copyIcon">
                                    <CopyButton
                                        text={addressValue}
                                        className="copyIcon"
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
                                        inputAsset={inputName}
                                        outputAsset={receiveName}
                                    />

                                    <div className="modal__highlight">
                                        {addressValue}
                                    </div>
                                </div>
                            </div>
                            {hasMemo ? (
                                <div
                                    className="grid-block"
                                    style={{marginTop: "10px"}}
                                >
                                    <div className="copyIcon">
                                        <CopyButton
                                            text={receive_address.memo}
                                            className="copyIcon"
                                        />
                                    </div>
                                    <div>
                                        <Translate
                                            unsafe
                                            content="gateway.purchase_notice_memo"
                                            component="div"
                                            style={{
                                                fontSize: "0.8rem",
                                                fontWeight: "bold",
                                                paddingBottom: "0.3rem"
                                            }}
                                        />
                                        <div className="modal__highlight">
                                            {receive_address.memo}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                    <div>
                        <div className="no-margin no-padding">
                            <button
                                className="button primary hollow"
                                onClick={this.onClose.bind(this)}
                            >
                                <Translate content="transfer.close" />
                            </button>
                        </div>
                    </div>
                </span>
                <span style={apiError ? {display: ""} : {display: "none"}}>
                    <div className="container-row double-row">
                        <Translate
                            className="txtlabel cancel"
                            content="gateway.unavailable_TRADE"
                            component="h3"
                        />
                        <button
                            className="button primary hollow"
                            onClick={this.onClose.bind(this)}
                        >
                            <Translate content="transfer.close" />
                        </button>
                    </div>
                </span>
            </div>
        );
    }

    _renderCurrentBalance() {
        const {name: assetName} = utils.replaceName(this.props.asset);
        const isDeposit = this.props.action === "deposit";

        let currentBalance = this.props.balances.find(b => {
            return b && b.get("asset_type") === this.props.asset.get("id");
        });

        let asset = currentBalance
            ? new Asset({
                  asset_id: currentBalance.get("asset_type"),
                  precision: this.props.asset.get("precision"),
                  amount: currentBalance.get("balance")
              })
            : null;

        const applyBalanceButton = isDeposit ? (
            <span
                style={{border: "2px solid black", borderLeft: "none"}}
                className="form-label"
            >
                {assetName}
            </span>
        ) : (
            <button
                data-place="right"
                data-tip={counterpart.translate("tooltip.withdraw_full")}
                className="button"
                style={{border: "2px solid black", borderLeft: "none"}}
                onClick={this._updateAmount.bind(
                    this,
                    !currentBalance
                        ? 0
                        : parseInt(currentBalance.get("balance"), 10)
                )}
            >
                <Icon name="clippy" />
            </button>
        );

        return (
            <div
                className="SimpleTrade__withdraw-row"
                style={{fontSize: "1rem"}}
            >
                <label style={{fontSize: "1rem"}}>
                    {counterpart.translate("gateway.balance_asset", {
                        asset: assetName
                    })}:
                    <span className="inline-label">
                        <input
                            disabled
                            style={{
                                color: "black",
                                border: "2px solid black",
                                padding: 10,
                                width: "100%"
                            }}
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

        return (
            <div className="grid-block vertical no-overflow">
                <div className="modal__header">
                    <Translate component="p" content="modal.buy.title" />
                </div>

                {this.props.isDown ? (
                    <div style={{textAlign: "center"}}>
                        <Translate
                            className="txtlabel cancel"
                            content="gateway.unavailable_TRADE"
                            component="p"
                        />
                    </div>
                ) : !this.props.isAvailable ? (
                    <div style={{textAlign: "center"}}>
                        <Translate
                            className="txtlabel cancel"
                            content="gateway.unavailable"
                            component="p"
                        />
                    </div>
                ) : (
                    this._renderDeposit()
                )}
            </div>
        );
    }
}
SimpleDepositBlocktradesBridge = BindToChainState(
    SimpleDepositBlocktradesBridge
);

class StoreWrapper extends React.Component {
    render() {
        let {preferredBridge, ...others} = this.props;
        let currentBridge = this.props.bridges.get(this.props.preferredBridge);
        if (!currentBridge) {
            currentBridge = this.props.bridges.first();
            preferredBridge = currentBridge.inputCoinType;
        }
        return (
            <SimpleDepositBlocktradesBridge
                {...others}
                preferredBridge={preferredBridge}
                {...currentBridge.toJS()}
            />
        );
    }
}

StoreWrapper = connect(StoreWrapper, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            preferredBridge: SettingsStore.getState().viewSettings.get(
                "preferredBridge",
                "btc"
            )
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

        return !this.state.open ? null : (
            <BaseModal
                id={this.props.modalId}
                onClose={this.onClose.bind(this)}
                noCloseBtn
                overlay={true}
            >
                {this.state.open ? (
                    <StoreWrapper {...this.props} open={this.state.open} />
                ) : null}
            </BaseModal>
        );
    }
}
