import React from "react";
import Translate from "react-translate-component";
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
import LoadingIndicator from "../LoadingIndicator";
import {blockTradesAPIs} from "api/apiConfig";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import QRCode from "qrcode.react";
import {
    Form,
    Modal,
    Button,
    Tooltip,
    Input,
    Select
} from "bitshares-ui-style-guide";

class SimpleDepositBlocktradesBridge extends React.Component {
    static propTypes = {
        sender: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired
    };

    constructor(props) {
        super();
        this.state = {
            inputCoinType: props.inputCoinType || this.props.preferredBridge,
            outputCoinType: props.outputCoinType,
            receiveAmount: 0,
            depositLimit: 0,
            sendAmount: 0,
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
        this.props.hideModal();
    }

    componentWillMount() {
        this._getDepositAddress(this.props);
    }

    componentDidMount() {
        this._getDepositLimit(this.props);
        this._estimateOutput(this.props);
    }

    componentWillReceiveProps(np) {
        if (
            np.inputCoinType !== this.props.inputCoinType ||
            np.outputCoinType !== this.props.outputCoinType
        ) {
            this.setState({
                inputCoinType: np.inputCoinType,
                outputCoinType: np.outputCoinType
            });
            this._getDepositLimit(np);
            this._estimateOutput(np);
            this._getDepositAddress(np);
        }
    }

    componentDidUpdate() {
        ReactTooltip.rebuild();
    }

    shouldComponentUpdate(np, ns) {
        if (
            this.state.inputCoinType !== ns.inputCoinType ||
            this.state.outputCoinType !== ns.outputCoinType
        ) {
            this._getDepositLimit(ns);
            this._estimateOutput(ns);
            this._getDepositAddress(ns);
        }

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

    _getDepositAddress(data) {
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
            requestDepositAddress(this._getDepositObject(data));
        } else {
            this.setState({
                receive_address
            });
        }
    }

    _getDepositObject(data) {
        let {inputCoinType, outputCoinType} = data;
        return {
            inputCoinType: inputCoinType.toLowerCase(),
            outputCoinType: outputCoinType.toLowerCase(),
            outputAddress: this.props.sender.get("name"),
            url: blockTradesAPIs.BASE,
            stateCallback: receive_address => {
                this.addDepositAddress(
                    inputCoinType.toLowerCase(),
                    outputCoinType.toLowerCase(),
                    this.props.sender.get("name"),
                    receive_address
                );
            }
        };
    }

    _getDepositLimit(data) {
        let {inputCoinType, outputCoinType} = data;

        this.setState({limitLoading: true});
        getDepositLimit(
            inputCoinType.toLowerCase(),
            outputCoinType.toLowerCase()
        )
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

    _onAmountChange(type, e) {
        let value = e.target.value;

        const regexp_numeral = new RegExp(/[[:digit:]]/);

        // Ensure input is valid
        if (!regexp_numeral.test(value)) {
            value = value.replace(/[^0-9.]/g, "");
        }

        // Catch initial decimal input
        if (value.charAt(0) == ".") {
            value = "0.";
        }

        // Catch double decimal and remove if invalid
        if (value.charAt(value.length) != value.search(".")) {
            value.substr(1);
        }

        value = utils.limitByPrecision(value, 8);

        switch (type) {
            case "input":
                this.setState(
                    {inputAmount: value},
                    this._estimateOutput.bind(this)
                );
                break;

            case "output":
                this.setState(
                    {outputAmount: value},
                    this._estimateInput.bind(this)
                );
                break;
        }
    }

    _estimateOutput() {
        let {inputAmount, inputCoinType, outputCoinType} = this.state;

        this.setState({receiveAmount: 0, sendAmount: inputAmount});
        if (!inputAmount) return;

        this.setState({receiveLoading: true});
        estimateOutput(
            inputAmount,
            inputCoinType.toLowerCase(),
            outputCoinType.toLowerCase()
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

    _estimateInput() {
        let {outputAmount, inputCoinType, outputCoinType} = this.state;

        this.setState({receiveAmount: outputAmount, sendAmount: 0});
        if (!outputAmount) return;

        this.setState({receiveLoading: true});
        estimateInput(
            outputAmount,
            inputCoinType.toLowerCase(),
            outputCoinType.toLowerCase()
        )
            .then(res => {
                console.log(res);
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

    _setDepositAsset(value) {
        this.setState({
            inputCoinType: value
        });

        SettingsActions.changeViewSetting({preferredBridge: value});
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

        const inputName = this.state.inputCoinType.toUpperCase();
        const receiveName = (prefix ? prefix : "") + assetName;

        let price = (this.state.receiveAmount / this.state.inputAmount).toFixed(
            4
        );
        let priceSuffix = receiveName + "/" + inputName;

        const aboveLimit =
            this.state.inputAmount > parseFloat(this.state.depositLimit) ||
            this.state.sendAmount > parseFloat(this.state.depositLimit);

        return (
            <div className="modal__body" style={{paddingTop: 0}}>
                <Form className="full-width" layout="vertical">
                    <Form.Item label={counterpart.translate("modal.buy.asset")}>
                        <Input disabled value={receiveName} />
                    </Form.Item>
                    <Form.Item
                        label={counterpart.translate("modal.buy.bridge")}
                    >
                        <Tooltip
                            title={counterpart.translate(
                                "tooltip.bridge_TRADE"
                            )}
                        >
                            <Input
                                disabled
                                type="text"
                                defaultValue={"BLOCKTRADES"}
                            />
                        </Tooltip>
                    </Form.Item>
                </Form>
                {!apiError ? (
                    <span>
                        <div className="grid-block no-overflow wrap shrink">
                            <div
                                className="small-12 medium-6"
                                style={{paddingRight: 5}}
                            >
                                <Form className="full-width" layout="vertical">
                                    <Form.Item
                                        label={counterpart.translate(
                                            "transfer.send"
                                        )}
                                        validateStatus={
                                            aboveLimit ? "error" : ""
                                        }
                                        help={
                                            aboveLimit
                                                ? counterpart.translate(
                                                      "gateway.over_limit"
                                                  )
                                                : ""
                                        }
                                    >
                                        <Input
                                            value={this.state.sendAmount}
                                            onChange={this._onAmountChange.bind(
                                                this,
                                                "input"
                                            )}
                                            addonAfter={
                                                <Select
                                                    defaultValue={this.state.inputCoinType.toUpperCase()}
                                                    value={this.state.inputCoinType.toUpperCase()}
                                                    style={{width: 100}}
                                                    onChange={this._setDepositAsset.bind(
                                                        this
                                                    )}
                                                >
                                                    {bridgeAssets.map(asset => (
                                                        <Select.Option
                                                            key={asset.toUpperCase()}
                                                        >
                                                            {asset.toUpperCase()}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            }
                                        />
                                    </Form.Item>
                                </Form>
                            </div>
                            <div
                                className="small-12 medium-6"
                                style={{paddingRight: 5}}
                            >
                                <Form className="full-width" layout="vertical">
                                    <Form.Item
                                        label={counterpart.translate(
                                            "gateway.deposit_limit"
                                        )}
                                    >
                                        <Input
                                            value={this.state.depositLimit}
                                            disabled={true}
                                            addonAfter={
                                                <Select
                                                    defaultValue={this.state.inputCoinType.toUpperCase()}
                                                    value={this.state.inputCoinType.toUpperCase()}
                                                    style={{width: 100}}
                                                    disabled
                                                    showArrow={false}
                                                >
                                                    {bridgeAssets.map(asset => (
                                                        <Select.Option
                                                            key={asset.toUpperCase()}
                                                        >
                                                            {asset.toUpperCase()}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            }
                                        />
                                    </Form.Item>
                                </Form>
                            </div>
                        </div>

                        <div className="grid-block no-overflow wrap shrink">
                            <div
                                className="small-12 medium-6"
                                style={{paddingRight: 5}}
                            >
                                <Form className="full-width" layout="vertical">
                                    <Form.Item
                                        label={counterpart.translate(
                                            "exchange.receive"
                                        )}
                                    >
                                        <Input
                                            value={this.state.receiveAmount}
                                            onChange={this._onAmountChange.bind(
                                                this,
                                                "output"
                                            )}
                                            addonAfter={
                                                <Select
                                                    defaultValue={receiveName}
                                                    value={receiveName}
                                                    style={{width: 100}}
                                                    disabled
                                                    showArrow={false}
                                                >
                                                    <Select.Option
                                                        key={receiveName}
                                                    >
                                                        {receiveName}
                                                    </Select.Option>
                                                </Select>
                                            }
                                        />
                                    </Form.Item>
                                </Form>
                            </div>
                            <div
                                className="small-12 medium-6"
                                style={{paddingRight: 5}}
                            >
                                <Form className="full-width" layout="vertical">
                                    <Form.Item
                                        label={counterpart.translate(
                                            "exchange.price"
                                        )}
                                    >
                                        <Input
                                            value={
                                                aboveLimit || isNaN(price)
                                                    ? 0
                                                    : price
                                            }
                                            disabled={true}
                                            addonAfter={
                                                <Select
                                                    defaultValue={priceSuffix}
                                                    value={priceSuffix}
                                                    style={{width: 125}}
                                                    disabled
                                                    showArrow={false}
                                                >
                                                    <Select.Option
                                                        key={priceSuffix}
                                                    >
                                                        {priceSuffix}
                                                    </Select.Option>
                                                </Select>
                                            }
                                        />
                                    </Form.Item>
                                </Form>
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
                    </span>
                ) : (
                    <Translate content="modal.deposit.address_generation_error" />
                )}
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
                hideModal={this.props.hideModal}
                {...others}
                preferredBridge={preferredBridge}
                {...currentBridge.toJS()}
            />
        );
    }
}

StoreWrapper = connect(
    StoreWrapper,
    {
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
    }
);

export default class SimpleDepositBlocktradesBridgeModal extends React.Component {
    render() {
        if (!this.props.bridges) return null;

        return (
            <Modal
                title={counterpart.translate("modal.buy.title")}
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                footer={[
                    <Button key="cancel" onClick={this.props.hideModal}>
                        {counterpart.translate("modal.close")}
                    </Button>
                ]}
            >
                <StoreWrapper {...this.props} open={this.props.visible} />
            </Modal>
        );
    }
}
