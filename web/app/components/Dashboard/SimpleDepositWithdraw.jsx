import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import { Asset } from "common/MarketClasses";
import utils from "common/utils";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import AccountActions from "actions/AccountActions";
import ReactTooltip from "react-tooltip";
import counterpart from "counterpart";
import {requestDepositAddress, validateAddress, WithdrawAddresses} from "common/blockTradesMethods";
import BlockTradesDepositAddressCache from "common/BlockTradesDepositAddressCache";
import CopyButton from "../Utility/CopyButton";
import Icon from "../Icon/Icon";
import LoadingIndicator from "../LoadingIndicator";

// import DepositFiatOpenLedger from "components/DepositWithdraw/openledger/DepositFiatOpenLedger";
// import WithdrawFiatOpenLedger from "components/DepositWithdraw/openledger/WithdrawFiatOpenLedger";

class DepositWithdrawContent extends React.Component {

    static propTypes = {
        sender: ChainTypes.ChainAccount.isRequired,
        issuer: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired,
        globalObject: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        coreAsset: "1.3.0",
        globalObject: "2.0.0",
        issuer: "openledger-wallet"
    }

    constructor(props) {
        super();
        this.state = {
            toAddress: WithdrawAddresses.getLast(props.walletType),
            withdrawValue:"",
            amountError: null,
            to_withdraw: new Asset({
                asset_id: props.asset.get("id"),
                precision: props.asset.get("precision")
            })
        };

        this._validateAddress(this.state.toAddress, props);

        this.deposit_address_cache = new BlockTradesDepositAddressCache();
        this.addDepositAddress = this.addDepositAddress.bind(this);
    }

    componentWillMount() {
        this._getDepositAddress();
    }

    componentWillReceiveProps(np) {
        if (np.asset && np.asset !== this.props.asset) {
            this.setState({
                to_withdraw: new Asset({
                    asset_id: np.asset.get("id"),
                    precision: np.asset.get("precision")
                }),
                memo: "",
                withdrawValue: "",
                receive_address: null,
                toAddress: WithdrawAddresses.getLast(np.walletType)
            }, this._getDepositAddress);
        }
    }

    _getDepositAddress() {
        if (!this.props.backingCoinType) return;
        let account_name = this.props.sender.get("name");
        let receive_address = this.deposit_address_cache.getCachedInputAddress(
            "openledger",
            account_name,
            this.props.backingCoinType.toLowerCase(),
            this.props.symbol.toLowerCase()
        );
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

    addDepositAddress( receive_address ) {
        let account_name = this.props.sender.get("name");
        this.deposit_address_cache.cacheInputAddress(
            "openledger",
            account_name,
            this.props.backingCoinType.toLowerCase(),
            this.props.symbol.toLowerCase(),
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

    onSubmit(e) {
        e.preventDefault();
        if (this.state.to_withdraw.getAmount() === 0) {
            return this.setState({
                amountError: "transfer.errors.pos"
            });
        }

        if (!this.props.issuer) return;

        let fee = this._getFee();

        let feeToSubtract = this.state.to_withdraw.asset_id !== fee.asset ? 0 :
            fee.amount;

        AccountActions.transfer(
            this.props.sender.get("id"),
            this.props.issuer.get("id"),
            this.state.to_withdraw.getAmount() - feeToSubtract,
            this.state.to_withdraw.asset_id,
            this.props.backingCoinType.toLowerCase() + ":" + this.state.toAddress + (this.state.memo ? ":" + new Buffer(this.state.memo, "utf-8") : ""),
            null,
            fee.asset
        );
    }

    _updateAmount(amount) {
        this.state.to_withdraw.setAmount({sats: amount});
        this.setState({
            withdrawValue: this.state.to_withdraw.getAmount({real: true}),
            amountError: null
        });
    }

    _getFee() {
        let {globalObject, asset, coreAsset, balances} = this.props;
        return utils.getFee({
            opType: "transfer",
            options: [],
            globalObject,
            asset,
            coreAsset,
            balances
        });
    }

    _onInputAmount(e) {
        try {
            this.state.to_withdraw.setAmount({
                real: parseFloat(e.target.value || 0)
            });
            this.setState({
                withdrawValue: e.target.value,
                amountError: null
            });
        } catch(err) {
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

    _renderWithdraw() {
        const {name: assetName} = utils.replaceName(this.props.asset.get("symbol"), !!this.props.asset.get("bitasset"));
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
        //         return (<p>Click <a href='#' onClick={(e)=>{ window.open(SettingsStore.site_registr,'_blank');}} >here</a> to register for deposits </p>);
        //     }
        // }

        return (
            <div>
                <p><Translate content="gateway.withdraw_funds" asset={assetName} /></p>

                {this._renderCurrentBalance()}

                <div className="SimpleTrade__withdraw-row">
                    <label>
                        {counterpart.translate("modal.withdraw.amount")}
                        <span className="inline-label">
                            <input tabIndex={tabIndex++} type="text" value={this.state.withdrawValue} onChange={this._onInputAmount.bind(this)} />
                            <span className="form-label">{assetName}</span>
                        </span>
                    </label>
                </div>

                <div className="SimpleTrade__withdraw-row">
                    <label>
                        {counterpart.translate("modal.withdraw.address")}
                        <span className="inline-label">
                            <input placeholder={counterpart.translate("gateway.withdraw_placeholder", {asset: assetName})} tabIndex={tabIndex++} type="text" value={this.state.toAddress} onChange={this._onInputTo.bind(this)} />
                            <span data-place="right" data-tip={counterpart.translate("tooltip.withdraw_address", {asset: assetName})} className="form-label"><Icon name="question-circle" className="fill-black" /></span>
                        </span>
                    </label>
                    {!this.state.validAddress && this.state.toAddress ? <div className="has-error" style={{paddingTop: 10}}><Translate content="gateway.valid_address" coin_type={assetName} /></div> : null}
                </div>

                {supportsMemos ? (
                    <div className="SimpleTrade__withdraw-row">
                        <label>
                            {counterpart.translate("transfer.memo")}
                            <span className="inline-label">
                                <textarea rows="1" value={this.state.memo} tabIndex={tabIndex++} onChange={this._onMemoChanged.bind(this)} />
                            </span>
                        </label>
                        {!this.state.validAddress && this.state.toAddress ? <div className="has-error" style={{paddingTop: 10}}><Translate content="gateway.valid_address" coin_type={assetName} /></div> : null}
                    </div>
                ) : null}

                <div className="button-group SimpleTrade__withdraw-row">
                    <button tabIndex={tabIndex++} className="button" onClick={this.onSubmit.bind(this)} type="submit" >
                        <Translate content="gateway.withdraw_now" />
                    </button>
                </div>
            </div>
        );
    }

    _renderDeposit() {
        const {receive_address} = this.state;
        const {name: assetName} = utils.replaceName(this.props.asset.get("symbol"), !!this.props.asset.get("bitasset"));
        const hasMemo = receive_address && "memo" in receive_address && receive_address.memo;
        const addressValue = receive_address && receive_address.address || "";
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
        //         return (<p>Click <a href='#' onClick={(e)=>{ window.open(SettingsStore.site_registr,'_blank');}} >here</a> to register for deposits </p>);
        //     }
        // }
        return (
            <div className={!addressValue ? "no-overflow" : ""}>
                <p><Translate content="gateway.add_funds" /></p>

                {this._renderCurrentBalance()}

                <div className="SimpleTrade__withdraw-row">
                    <p style={{marginBottom: 10}} data-place="right" data-tip={counterpart.translate("tooltip.deposit_tip", {asset: assetName})}>
                        <Translate className="help-tooltip" content="gateway.deposit_to" asset={assetName} />:
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

        // TEMP //
        // asset = new Asset({
        //     asset_id: this.props.asset.get("id"),
        //     precision: this.props.asset.get("precision"),
        //     amount: 65654645
        // });

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
        let {asset, action} = this.props;

        let isDeposit = action === "deposit";

        if (!asset) {
            return null;
        }

        const {replaceName:assetName} = utils.replaceName(asset.get("symbol"), true);

        return (
            <div className="SimpleTrade__modal">
                <div className="Modal__header">
                    <h3><Translate content={isDeposit ? "gateway.deposit" : "modal.withdraw.submit"} /> {assetName}</h3>
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

                    {isDeposit ? this._renderDeposit() : this._renderWithdraw()}
                </div>
            </div>
        );
    }
}
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
        return (
            <Modal onClose={this.onClose.bind(this)} id={this.props.modalId} overlay={true}>
                <Trigger close={this.props.modalId}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                {this.state.open ? <DepositWithdrawContent {...this.props} open={this.state.open} /> : null}
            </Modal>
        );
    }
}
