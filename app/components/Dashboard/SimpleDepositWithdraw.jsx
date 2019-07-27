import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
import {Asset} from "common/MarketClasses";
import utils from "common/utils";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import AccountActions from "actions/AccountActions";
import ReactTooltip from "react-tooltip";
import counterpart from "counterpart";
import {
    requestDepositAddress,
    validateAddress,
    WithdrawAddresses,
    getDepositAddress
} from "common/gatewayMethods";
import CopyButton from "../Utility/CopyButton";
import Icon from "../Icon/Icon";
import LoadingIndicator from "../LoadingIndicator";
import {checkBalance} from "common/trxHelper";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import {DecimalChecker} from "../Utility/DecimalChecker";
import {openledgerAPIs} from "api/apiConfig";
import {getWalletName} from "branding";
import {Modal, Tooltip} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";
import FeeAssetSelector from "components/Utility/FeeAssetSelector";

class DepositWithdrawContent extends DecimalChecker {
    static propTypes = {
        balance: ChainTypes.ChainObject,
        sender: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired,
        globalObject: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        coreAsset: "1.3.0",
        globalObject: "2.0.0"
    };

    constructor(props) {
        super();
        this.state = {
            toAddress: WithdrawAddresses.getLast(props.walletType),
            withdrawValue: "",
            amountError: null,
            symbol: props.asset.get("symbol"),
            to_withdraw: new Asset({
                asset_id: props.asset.get("id"),
                precision: props.asset.get("precision")
            }),
            fee_asset_id:
                ChainStore.assets_by_symbol.get(props.fee_asset_symbol) ||
                "1.3.0",
            feeAmount: new Asset({amount: 0}),
            loading: false,
            emptyAddressDeposit: false
        };

        this._validateAddress(this.state.toAddress, props);

        this.addDepositAddress = this.addDepositAddress.bind(this);
        this._checkBalance = this._checkBalance.bind(this);
        this._getCurrentBalance = this._getCurrentBalance.bind(this);
    }

    componentWillMount() {
        this._getDepositAddress();
    }

    componentWillReceiveProps(np) {
        if (
            np.asset &&
            this.props.asset &&
            np.asset.get("id") !== this.props.asset.get("id")
        ) {
            this.setState(
                {
                    to_withdraw: new Asset({
                        asset_id: np.asset.get("id"),
                        precision: np.asset.get("precision")
                    }),
                    gateFee: np.asset.get("gateFee"),
                    intermediateAccount: np.asset.get("intermediateAccount"),
                    symbol: np.asset.get("symbol"),
                    memo: "",
                    withdrawValue: "",
                    receive_address: null,
                    toAddress: WithdrawAddresses.getLast(np.walletType)
                },
                this._getDepositAddress
            );
        }
    }

    _getDepositAddress() {
        if (!this.props.backingCoinType) return;

        let receive_address = getDepositAddress({
            coin: `open.${this.props.backingCoinType.toLowerCase()}`,
            account: this.props.account,
            stateCallback: this.addDepositAddress
        });

        if (!receive_address) {
            requestDepositAddress(this._getDepositObject());
        } else {
            this.setState({
                receive_address
            });
        }
    }

    _getDepositObject() {
        return {
            inputCoinType: this.props.backingCoinType.toLowerCase(),
            outputCoinType: this.props.symbol.toLowerCase(),
            outputAddress: this.props.sender.get("name"),
            stateCallback: this.addDepositAddress
        };
    }

    requestDepositAddressLoad() {
        this.setState({
            loading: true,
            emptyAddressDeposit: false
        });
        requestDepositAddress(this._getDepositObject());
    }

    addDepositAddress(receive_address) {
        if (receive_address.error) {
            receive_address.error.message === "no_address"
                ? this.setState({emptyAddressDeposit: true})
                : this.setState({emptyAddressDeposit: false});
        }

        this.setState({
            receive_address,
            loading: false
        });
    }

    componentDidUpdate() {
        ReactTooltip.rebuild();
    }

    onSubmit(e) {
        e.preventDefault();
        if (this.state.to_withdraw.getAmount() === 0) {
            return this.setState({
                amountError: "transfer.errors.pos"
            });
        }

        if (!this.props.intermediateAccount) return;

        const fee = this.state.feeAmount;
        const gateFee = this._getGateFee();

        let sendAmount = this.state.to_withdraw.clone();

        let balanceAmount = sendAmount.clone(
            this._getCurrentBalance().get("balance")
        );

        sendAmount.plus(gateFee);

        /* Insufficient balance */
        if (balanceAmount.lt(sendAmount)) {
            // Send the originally entered amount
            sendAmount = this.state.to_withdraw.clone();
        }

        AccountActions.transfer(
            this.props.sender.get("id"),
            this.props.intermediateAccount,
            this.state.to_withdraw.getAmount(),
            this.state.to_withdraw.asset_id,
            this.props.backingCoinType.toLowerCase() +
                ":" +
                this.state.toAddress +
                (this.state.memo
                    ? ":" + new Buffer(this.state.memo, "utf-8")
                    : ""),
            null,
            fee.asset_id
        );
    }

    _updateAmount() {
        const {feeAmount} = this.state;
        const currentBalance = this._getCurrentBalance();

        let total = new Asset({
            amount: currentBalance ? currentBalance.get("balance") : 0,
            asset_id: this.props.asset.get("id"),
            precision: this.props.asset.get("precision")
        });

        // Subtract the fee if it is using the same asset
        if (total.asset_id === feeAmount.asset_id) {
            total.minus(feeAmount);
        }

        this.state.to_withdraw.setAmount({sats: total.getAmount()});
        this.setState(
            {
                withdrawValue: total.getAmount({real: true}),
                amountError: null
            },
            this._checkBalance
        );
    }
    _getCurrentBalance() {
        let balances = this.props.balance
            ? [ChainStore.getObject(this.props.balance)]
            : this.props.balances;

        return !!balances
            ? balances.find(b => {
                  return (
                      b && b.get("asset_type") === this.props.asset.get("id")
                  );
              })
            : null;
    }

    _checkBalance() {
        const {feeAmount, to_withdraw} = this.state;
        const {asset} = this.props;
        const balance = this._getCurrentBalance();
        if (!balance || !feeAmount) return;
        const hasBalance = checkBalance(
            to_withdraw.getAmount({real: true}),
            asset,
            feeAmount,
            balance,
            this._getGateFee()
        );
        if (hasBalance === null) return;
        if (this.state.balanceError !== !hasBalance)
            this.setState({balanceError: !hasBalance});

        return hasBalance;
    }

    _onInputAmount(e) {
        try {
            this.state.to_withdraw.setAmount({
                real: parseFloat(e.target.value || 0)
            });
            this.setState(
                {
                    withdrawValue: e.target.value,
                    amountError: null
                },
                this._checkBalance
            );
        } catch (err) {
            console.error("err:", err);
        }
    }

    _onInputTo(e) {
        let toAddress = e.target.value.trim();

        this.setState({
            withdraw_address_check_in_progress: true,
            withdraw_address_selected: toAddress,
            validAddress: null,
            toAddress: toAddress
        });

        this._validateAddress(toAddress);
    }

    _onMemoChanged(e) {
        this.setState({memo: e.target.value});
    }

    _validateAddress(address, props = this.props) {
        validateAddress({
            url: openledgerAPIs.BASE,
            walletType: props.walletType,
            newAddress: address
        })
            .then(isValid => {
                if (this.state.toAddress === address) {
                    this.setState({
                        withdraw_address_check_in_progress: false,
                        validAddress: !!isValid
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

    _getGateFee() {
        const {gateFee, asset} = this.props;
        return new Asset({
            real: parseFloat(gateFee ? gateFee.replace(",", "") : 0),
            asset_id: asset.get("id"),
            precision: asset.get("precision")
        });
    }

    onFeeChanged(asset) {
        this.setState({
            fee_asset_id: asset.asset_id,
            feeAmount: asset
        });
    }

    _renderWithdraw() {
        const {amountError} = this.state;
        const {name: assetName} = utils.replaceName(this.props.asset);
        let tabIndex = 1;
        const {supportsMemos} = this.props;

        // if(this.props.fiatModal){
        //     if(~this.props.fiatModal.indexOf('canFiatWith')){
        //         return (<WithdrawFiatOpenLedger
        //             account={this.props.account}
        //             issuer_account="openledger-fiat"
        //             deposit_asset={this.props.asset.get("symbol").split('OPEN.').join('')}
        //             receive_asset={this.props.asset.get("symbol")}
        //             rpc_url={SettingsStore.rpc_url}
        //         />);
        //     }else{
        //         return (<p>Click <a href='#' onClick={this._openRegistrarSite} >here</a> to register for deposits </p>);
        //     }
        // }

        const currentFee = this.state.feeAmount;

        const disableSubmit =
            !currentFee ||
            this.state.balanceError ||
            !this.state.toAddress ||
            !this.state.withdrawValue;

        return (
            <div>
                <p>
                    <Translate
                        content="gateway.withdraw_funds"
                        asset={assetName}
                        wallet_name={getWalletName()}
                    />
                </p>

                {this._renderCurrentBalance()}

                <div className="SimpleTrade__withdraw-row">
                    <label className="left-label">
                        {counterpart.translate("modal.withdraw.amount")}
                    </label>
                    <div className="inline-label input-wrapper">
                        <input
                            tabIndex={tabIndex++}
                            type="number"
                            min="0"
                            onKeyPress={this.onKeyPress.bind(this)}
                            value={this.state.withdrawValue}
                            onChange={this._onInputAmount.bind(this)}
                        />
                        <div className="form-label select floating-dropdown">
                            <div className="dropdown-wrapper inactive">
                                <div>{assetName}</div>
                            </div>
                        </div>
                    </div>
                    {amountError ? (
                        <p
                            className="has-error no-margin"
                            style={{paddingTop: 10}}
                        >
                            <Translate content={amountError} />
                        </p>
                    ) : null}
                    {this.state.balanceError ? (
                        <p
                            className="has-error no-margin"
                            style={{paddingTop: 10}}
                        >
                            <Translate content="transfer.errors.insufficient" />
                        </p>
                    ) : null}
                </div>

                <div className="SimpleTrade__withdraw-row withdraw-fee-selector">
                    <FeeAssetSelector
                        label="showcases.barter.fee_when_proposal_executes"
                        account={this.props.account}
                        trxInfo={{
                            type: "transfer",
                            options: ["price_per_kbyte"],
                            data: {
                                type: "memo",
                                content:
                                    this.props.backingCoinType.toLowerCase() +
                                    ":" +
                                    this.state.toAddress +
                                    (this.state.memo
                                        ? ":" + this.state.memo
                                        : "")
                            }
                        }}
                        onChange={this.onFeeChanged.bind(this)}
                    />
                </div>

                <div className="SimpleTrade__withdraw-row">
                    <label className="left-label">
                        {counterpart.translate("modal.withdraw.address")}
                    </label>
                    <div className="inline-label input-wrapper">
                        <input
                            placeholder={counterpart.translate(
                                "gateway.withdraw_placeholder",
                                {asset: assetName}
                            )}
                            tabIndex={tabIndex++}
                            type="text"
                            value={this.state.toAddress}
                            onChange={this._onInputTo.bind(this)}
                        />

                        <div className="form-label select floating-dropdown">
                            <div className="dropdown-wrapper inactive">
                                <Tooltip
                                    placement="right"
                                    title={counterpart.translate(
                                        "tooltip.withdraw_address",
                                        {asset: assetName}
                                    )}
                                >
                                    ?
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                    {!this.state.validAddress && this.state.toAddress ? (
                        <div className="has-error" style={{paddingTop: 10}}>
                            <Translate
                                content="gateway.valid_address"
                                coin_type={assetName}
                            />
                        </div>
                    ) : null}
                </div>

                {supportsMemos ? (
                    <div className="SimpleTrade__withdraw-row">
                        <label className="left-label">
                            {counterpart.translate("transfer.memo")}
                        </label>
                        <div className="inline-label input-wrapper">
                            <textarea
                                rows="3"
                                value={this.state.memo}
                                tabIndex={tabIndex++}
                                onChange={this._onMemoChanged.bind(this)}
                            />
                        </div>
                        {!this.state.validAddress && this.state.toAddress ? (
                            <div className="has-error" style={{paddingTop: 10}}>
                                <Translate
                                    content="gateway.valid_address"
                                    coin_type={assetName}
                                />
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className="button-group SimpleTrade__withdraw-row">
                    <button
                        tabIndex={tabIndex++}
                        className={
                            "button" + (disableSubmit ? " disabled" : "")
                        }
                        onClick={this.onSubmit.bind(this)}
                        type="submit"
                    >
                        <Translate content="gateway.withdraw_now" />
                    </button>
                </div>
            </div>
        );
    }

    _renderDeposit() {
        const {receive_address, loading, emptyAddressDeposit} = this.state;
        const {name: assetName} = utils.replaceName(this.props.asset);
        const hasMemo =
            receive_address &&
            "memo" in receive_address &&
            receive_address.memo;
        const addressValue = (receive_address && receive_address.address) || "";
        let tabIndex = 1;

        // if(this.props.fiatModal){
        //     if(~this.props.fiatModal.indexOf('canFiatDep')){
        //         return (<DepositFiatOpenLedger
        //             account={this.props.account}
        //             issuer_account="openledger-fiat"
        //             deposit_asset={this.props.asset.get("symbol").split('OPEN.').join('')}
        //             receive_asset={this.props.asset.get("symbol")}
        //             rpc_url={SettingsStore.rpc_url}
        //         />);
        //     }else{
        //         return (<p>Click <a href='#' onClick={this._openRegistrarSite} >here</a> to register for deposits </p>);
        //     }
        // }
        return (
            <div className={!addressValue ? "no-overflow" : ""}>
                <p>
                    <Translate
                        unsafe
                        content="gateway.add_funds"
                        account={this.props.sender.get("name")}
                        wallet_name={getWalletName()}
                    />
                </p>

                {this._renderCurrentBalance()}

                <div className="SimpleTrade__withdraw-row">
                    <Tooltip
                        placement="right"
                        title={counterpart.translate("tooltip.deposit_tip", {
                            asset: assetName
                        })}
                    >
                        <p style={{marginBottom: 10}}>
                            <Translate
                                className="help-tooltip"
                                content="gateway.deposit_to"
                                asset={assetName}
                            />
                            :
                            <label className="fz_12 left-label">
                                <Translate content="gateway.deposit_notice_delay" />
                            </label>
                        </p>
                    </Tooltip>
                    {!addressValue ? (
                        <LoadingIndicator type="three-bounce" />
                    ) : (
                        <label>
                            {emptyAddressDeposit ? (
                                <Translate content="gateway.please_generate_address" />
                            ) : (
                                <span className="inline-label">
                                    <input
                                        readOnly
                                        type="text"
                                        value={addressValue}
                                    />
                                    <CopyButton text={addressValue} />{" "}
                                </span>
                            )}
                        </label>
                    )}
                    {hasMemo ? (
                        <label>
                            <span className="inline-label">
                                <input
                                    readOnly
                                    type="text"
                                    value={
                                        counterpart.translate("transfer.memo") +
                                        ": " +
                                        receive_address.memo
                                    }
                                />

                                <CopyButton text={receive_address.memo} />
                            </span>
                        </label>
                    ) : null}

                    {receive_address && receive_address.error ? (
                        <div className="has-error" style={{paddingTop: 10}}>
                            {receive_address.error.message}
                        </div>
                    ) : null}
                </div>

                <div className="button-group SimpleTrade__withdraw-row">
                    <button
                        tabIndex={tabIndex++}
                        className="button spinner-button-circle"
                        onClick={this.requestDepositAddressLoad.bind(this)}
                        type="submit"
                    >
                        {loading ? <LoadingIndicator type="circle" /> : null}
                        <Translate content="gateway.generate_new" />
                    </button>
                </div>
            </div>
        );
    }

    _renderCurrentBalance() {
        const {name: assetName} = utils.replaceName(this.props.asset);
        const isDeposit = this.props.action === "deposit";

        let currentBalance = this._getCurrentBalance();

        let asset = currentBalance
            ? new Asset({
                  asset_id: currentBalance.get("asset_type"),
                  precision: this.props.asset.get("precision"),
                  amount: currentBalance.get("balance")
              })
            : null;

        // TEMP //
        // asset = new Asset({
        //     asset_id: this.props.asset.get("id"),
        //     precision: this.props.asset.get("precision"),
        //     amount: 65654645
        // });

        const applyBalanceButton = isDeposit ? (
            <span
                style={{border: "2px solid black", borderLeft: "none"}}
                className="form-label"
            >
                {assetName}
            </span>
        ) : (
            <Tooltip
                placement="right"
                title={counterpart.translate("tooltip.withdraw_full")}
            >
                <button
                    className="button"
                    style={{border: "2px solid black", borderLeft: "none"}}
                    onClick={this._updateAmount.bind(
                        this,
                        !currentBalance
                            ? 0
                            : parseInt(currentBalance.get("balance"), 10)
                    )}
                >
                    <Icon name="clippy" title="icons.clippy.withdraw_full" />
                </button>
            </Tooltip>
        );

        return (
            <div
                className="SimpleTrade__withdraw-row"
                style={{fontSize: "1rem"}}
            >
                <label style={{fontSize: "1rem"}}>
                    {counterpart.translate("gateway.balance_asset", {
                        asset: assetName
                    })}
                    :
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
        let {asset, action} = this.props;
        let isDeposit = action === "deposit";

        if (!asset) {
            return null;
        }

        const {name: assetName} = utils.replaceName(asset);

        let content = this.props.isDown ? (
            <div>
                <Translate
                    className="txtlabel cancel"
                    content="gateway.unavailable_OPEN"
                    component="p"
                />
            </div>
        ) : !this.props.isAvailable ? (
            <div>
                <Translate
                    className="txtlabel cancel"
                    content="gateway.unavailable"
                    component="p"
                />
            </div>
        ) : isDeposit ? (
            this._renderDeposit()
        ) : (
            this._renderWithdraw()
        );

        return (
            <div className="SimpleTrade__modal">
                <div
                    className="grid-block vertical no-overflow"
                    style={{
                        zIndex: 1002,
                        paddingLeft: "2rem",
                        paddingRight: "2rem",
                        paddingTop: "1rem"
                    }}
                >
                    {content}
                </div>
            </div>
        );
    }
}

DepositWithdrawContent = connect(
    DepositWithdrawContent,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps(props) {
            return {
                fee_asset_symbol: SettingsStore.getState().settings.get(
                    "fee_asset"
                )
            };
        }
    }
);

DepositWithdrawContent = BindToChainState(DepositWithdrawContent);

export default class SimpleDepositWithdrawModal extends React.Component {
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
        const isDeposit = this.props.action === "deposit";

        const title = isDeposit
            ? counterpart.translate("gateway.deposit")
            : counterpart.translate("modal.withdraw.submit");

        return (
            <Modal
                title={title}
                footer={[]}
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                className="test"
                onClose={this.onClose.bind(this)}
                overlay={true}
                id={this.props.modalId}
            >
                {this.props.visible ? (
                    <DepositWithdrawContent
                        {...this.props}
                        open={this.props.visible}
                    />
                ) : null}
            </Modal>
        );
    }
}
