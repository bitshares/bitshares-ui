import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import utils from "common/utils";
import BalanceComponent from "components/Utility/BalanceComponent";
import counterpart from "counterpart";
import AmountSelector from "components/Utility/AmountSelector";
import AccountActions from "actions/AccountActions";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import { validateAddress, WithdrawAddresses } from "common/blockTradesMethods";
import AccountStore from "stores/AccountStore";
import {ChainStore} from "bitsharesjs/es";
import Modal from "react-foundation-apps/src/modal";
import {checkFeePayment} from "common/asyncTransferHelper";
import {Asset} from "common/MarketClasses";

class WithdrawModalBlocktrades extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        issuer: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired,
        output_coin_name: React.PropTypes.string.isRequired,
        output_coin_symbol: React.PropTypes.string.isRequired,
        output_coin_type: React.PropTypes.string.isRequired,
        url: React.PropTypes.string,
        output_wallet_type: React.PropTypes.string,
        output_supports_memos: React.PropTypes.bool.isRequired,
        amount_to_withdraw: React.PropTypes.string,
        balance: ChainTypes.ChainObject
    };

    constructor(props) {
        super(props);

        this.state = {
            withdraw_amount: this.props.amount_to_withdraw,
            withdraw_address: WithdrawAddresses.getLast(props.output_wallet_type),
            withdraw_address_check_in_progress: true,
            withdraw_address_is_valid: null,
            options_is_valid: false,
            confirmation_is_valid: false,
            withdraw_address_selected: WithdrawAddresses.getLast(props.output_wallet_type),
            memo: "",
            withdraw_address_first: true,
            empty_withdraw_value: false,
            from_account: ChainStore.getAccount(AccountStore.getState().currentAccount),
            asset: null,
            feeAsset: ChainStore.getAsset("1.3.0"),
            fee_asset_id: "1.3.0"
        };


        this._validateAddress(this.state.withdraw_address, props);
    }

    componentWillMount() {
        checkFeePayment({accountID: this.props.account.get("id"), feeID: this.state.fee_asset_id}).then(({fee, hasBalance, hasPoolBalance}) => {
            this.setState({
                feeAmount: fee,
                hasBalance,
                hasPoolBalance
            });
        });
    }

    onMemoChanged( e ) {
        this.setState( {memo: e.target.value} );
    }

    onWithdrawAmountChange( {amount} ) {
        this.setState({
            withdraw_amount: amount,
            empty_withdraw_value: amount !== undefined && !parseFloat(amount)
        });
    }

    onSelectChanged(index) {
        let new_withdraw_address = WithdrawAddresses.get(this.props.output_wallet_type)[index];
        WithdrawAddresses.setLast({wallet: this.props.output_wallet_type, address: new_withdraw_address});

        this.setState({
            withdraw_address_selected: new_withdraw_address,
            options_is_valid: false,
            withdraw_address: new_withdraw_address,
            withdraw_address_check_in_progress: true,
            withdraw_address_is_valid: null
        });
        this._validateAddress(new_withdraw_address);
    }

    onWithdrawAddressChanged( e ) {
        let new_withdraw_address = e.target.value.trim();

        this.setState({
            withdraw_address: new_withdraw_address,
            withdraw_address_check_in_progress: true,
            withdraw_address_selected: new_withdraw_address,
            withdraw_address_is_valid: null
        });
        this._validateAddress(new_withdraw_address);
    }

    _validateAddress(new_withdraw_address, props = this.props) {
        validateAddress({url: props.url, walletType: props.output_wallet_type, newAddress: new_withdraw_address})
            .then(isValid => {
                if (this.state.withdraw_address === new_withdraw_address) {
                    this.setState({
                        withdraw_address_check_in_progress: false,
                        withdraw_address_is_valid: isValid
                    });
                }
            });
    }

    onSubmit() {

        if ((!this.state.withdraw_address_check_in_progress) && (this.state.withdraw_address && this.state.withdraw_address.length) && (this.state.withdraw_amount !== null)) {
            if (!this.state.withdraw_address_is_valid) {
                ZfApi.publish(this.getWithdrawModalId(), "open");
            } else if (parseFloat(this.state.withdraw_amount) > 0){
                if (!WithdrawAddresses.has(this.props.output_wallet_type)) {
                    let withdrawals = [];
                    withdrawals.push(this.state.withdraw_address);
                    WithdrawAddresses.set({wallet: this.props.output_wallet_type, addresses: withdrawals});
                } else {
                    let withdrawals = WithdrawAddresses.get(this.props.output_wallet_type);
                    if (withdrawals.indexOf(this.state.withdraw_address) == -1) {
                        withdrawals.push(this.state.withdraw_address);
                        WithdrawAddresses.set({wallet: this.props.output_wallet_type, addresses: withdrawals});
                    }
                }
                WithdrawAddresses.setLast({wallet: this.props.output_wallet_type, address: this.state.withdraw_address});
                let asset = this.props.asset;
                let precision = utils.get_asset_precision(asset.get("precision"));
                let amount = String.prototype.replace.call(this.state.withdraw_amount, /,/g, "");

                let {feeAsset} = this.state;

                AccountActions.transfer(
                    this.props.account.get("id"),
                    this.props.issuer.get("id"),
                    parseInt(amount * precision, 10),
                    asset.get("id"),
                    this.props.output_coin_type + ":" + this.state.withdraw_address + (this.state.memo ? ":" + new Buffer(this.state.memo, "utf-8") : ""),
                    null,
                    feeAsset ? feeAsset.get("id") : "1.3.0"
                );

                this.setState({
                    empty_withdraw_value: false
                });
            } else {
                this.setState({
                    empty_withdraw_value: true
                });
            }
        }
    }

    onSubmitConfirmation() {

        ZfApi.publish(this.getWithdrawModalId(), "close");

        if (!WithdrawAddresses.has(this.props.output_wallet_type)) {
            let withdrawals = [];
            withdrawals.push(this.state.withdraw_address);
            WithdrawAddresses.set({wallet: this.props.output_wallet_type, addresses: withdrawals});
        } else {
            let withdrawals = WithdrawAddresses.get(this.props.output_wallet_type);
            if (withdrawals.indexOf(this.state.withdraw_address) == -1) {
                withdrawals.push(this.state.withdraw_address);
                WithdrawAddresses.set({wallet: this.props.output_wallet_type, addresses: withdrawals});
            }
        }
        WithdrawAddresses.setLast({wallet: this.props.output_wallet_type, address: this.state.withdraw_address});
        let asset = this.props.asset;
        let precision = utils.get_asset_precision(asset.get("precision"));
        let amount = String.prototype.replace.call(this.state.withdraw_amount, /,/g, "");

        let {feeAsset} = this.state;

        AccountActions.transfer(
            this.props.account.get("id"),
            this.props.issuer.get("id"),
            parseInt(amount * precision, 10),
            asset.get("id"),
            this.props.output_coin_type + ":" + this.state.withdraw_address + (this.state.memo ? ":" + new Buffer(this.state.memo, "utf-8") : ""),
            null,
            feeAsset ? feeAsset.get("id") : "1.3.0"
        );
    }

    onDropDownList() {

        if (WithdrawAddresses.has(this.props.output_wallet_type)) {

            if(this.state.options_is_valid === false) {
                this.setState({options_is_valid: true});
                this.setState({ withdraw_address_first: false });
            }

            if(this.state.options_is_valid === true) {
                this.setState({options_is_valid: false});
            }
        }
    }

    getWithdrawModalId() {
        return "confirmation";
    }

    onAccountBalance() {
        const { feeAmount } = this.state;
        if (Object.keys(this.props.account.get("balances").toJS()).includes(this.props.asset.get("id")) ) {
            let total = new Asset({
                amount: this.props.balance.get("balance"),
                asset_id: this.props.asset.get("id"),
                precision: this.props.asset.get("precision")
            });

            // Subtract the fee if it is using the same asset
            if(total.asset_id === feeAmount.asset_id) {
                total.minus(feeAmount);
                // if(total_minus_fee<0){
                //     total_minus_fee=0;
                // }
            }

            this.setState({
                withdraw_amount: total.getAmount({real: true}),
                empty_withdraw_value: false
            });
        }
    }

    setNestedRef(ref) {
        this.nestedRef = ref;
    }

    _setTotal(asset_id, balance_id, fee, fee_asset_id) {

        const gateFee = parseInt(this.props.gateFee);

        let balanceObject = ChainStore.getObject(balance_id);
        let transferAsset = ChainStore.getObject(asset_id);
        if (balanceObject) {
            let amount = (utils.get_asset_amount(balanceObject.get("balance"), transferAsset) - gateFee - (asset_id === fee_asset_id ? fee : 0)).toString();
            this.setState({amount});
        }
    }

    onFeeChanged({asset}) {
        checkFeePayment({accountID: this.props.account.get("id"), feeID: asset.get("id")}).then(({fee, hasBalance, hasPoolBalance}) => {
            this.setState({
                feeAmount: fee,
                hasBalance,
                hasPoolBalance,
                feeAsset: asset,
                error: (!hasBalance || !hasPoolBalance),
                fee_asset_id: asset.get("id")
            });
        });
    }

    _getAvailableAssets(state = this.state) {
        const { from_account } = state;
        let fee_asset_types = [];
        if (!(from_account && from_account.get("balances"))) {
            return {fee_asset_types};
        }
        let account_balances = state.from_account.get("balances").toJS();
        fee_asset_types = Object.keys(account_balances).sort(utils.sortID);
        for (let key in account_balances) {
            let asset = ChainStore.getObject(key);
            let balanceObject = ChainStore.getObject(account_balances[key]);
            if (balanceObject && balanceObject.get("balance") === 0) {
                if (fee_asset_types.indexOf(key) !== -1) {
                    fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                }
            }

            if (asset) {
                // Remove any assets that do not have valid core exchange rates
                if (asset.get("id") !== "1.3.0" && !utils.isValidPrice(asset.getIn(["options", "core_exchange_rate"]))) {
                    fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                }
            }
        }

        return {fee_asset_types};
    }

    render() {

        let {withdraw_address_selected, memo} = this.state;
        let storedAddress = WithdrawAddresses.get(this.props.output_wallet_type);
        let balance = null;

        let account_balances = this.props.account.get("balances").toJS();
        let asset_types = Object.keys(account_balances);

        let withdrawModalId = this.getWithdrawModalId();
        let invalid_address_message = null;
        let options = null;
        let confirmation = null;

        if (this.state.options_is_valid) {
            options =
			    <div className={!storedAddress.length ? "blocktrades-disabled-options" : "blocktrades-options"}>
                    {storedAddress.map(function(name, index){
                        return <a key={index} onClick={this.onSelectChanged.bind(this, index)}>{name}</a>;
                    }, this)}
                </div>;
        }

        if (!this.state.withdraw_address_check_in_progress && (this.state.withdraw_address && this.state.withdraw_address.length))
        {
            if (!this.state.withdraw_address_is_valid) {

                invalid_address_message = <div className="has-error" style={{paddingTop: 10}}><Translate content="gateway.valid_address" coin_type={this.props.output_coin_type} /></div>;
                confirmation =
                <Modal id={withdrawModalId} overlay={true}>
                    <Trigger close={withdrawModalId}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <br/>
					<label><Translate content="modal.confirmation.title"/></label>
		 		    <br/>
				    <div className="content-block">
                        <input type="submit" className="button"
                        onClick={this.onSubmitConfirmation.bind(this)}
                        value={counterpart.translate("modal.confirmation.accept")} />
                        <Trigger close={withdrawModalId}>
                            <a href className="secondary button"><Translate content="modal.confirmation.cancel" /></a>
                        </Trigger>
                    </div>
		        </Modal>;
            }
            // if (this.state.withdraw_address_is_valid)
            //   invalid_address_message = <Icon name="checkmark-circle" className="success" />;
            // else
            //   invalid_address_message = <Icon name="cross-circle" className="alert" />;
        }

        let tabIndex = 1;
        let withdraw_memo = null;

        if (this.props.output_supports_memos) {
            withdraw_memo =
				<div className="content-block">
					<label><Translate component="span" content="transfer.memo"/></label>
					<textarea rows="1" value={memo} tabIndex={tabIndex++} onChange={this.onMemoChanged.bind(this)} />
				</div>;
        }

        // Estimate fee VARIABLES
        let { fee_asset_types } = this._getAvailableAssets();

        // let fee_asset_choosen= "1.3.0";
        //
        // if(fee_asset_types.indexOf(fee_asset_choosen)==-1){
        //     feeAsset =  ChainStore.getAsset(fee_asset_types[0]);
        // }

        if (asset_types.length > 0) {
            let current_asset_id = this.props.asset.get("id");
            if( current_asset_id ){
                let current = account_balances[current_asset_id];
                balance = (
                    <span>
                        <Translate component="span" content="transfer.available"/>&nbsp;:&nbsp;
                        <span className="set-cursor" onClick={this.onAccountBalance.bind(this)}>
                            {current ? <BalanceComponent balance={account_balances[current_asset_id]}/> : 0}
                        </span>
                    </span>
                );}
            else
                balance = "No funds";
        } else {
            balance = "No funds";
        }

        return (<form className="grid-block vertical full-width-content">
            <div className="grid-container">
                <div className="content-block">
                    <h3><Translate content="gateway.withdraw_coin" coin={this.props.output_coin_name} symbol={this.props.output_coin_symbol} /></h3>
                </div>

                {/* Withdraw amount */}
                <div className="content-block">
                    <AmountSelector label="modal.withdraw.amount"
                        amount={this.state.withdraw_amount}
                        asset={this.props.asset.get("id")}
                        assets={[this.props.asset.get("id")]}
                        placeholder="0.0"
                        onChange={this.onWithdrawAmountChange.bind(this)}
                        display_balance={balance}
                    />
                    {this.state.empty_withdraw_value ? <p className="has-error no-margin" style={{paddingTop: 10}}><Translate content="transfer.errors.valid" /></p>:null}
                </div>

                {/* Fee selection */}
                {this.state.feeAmount ? <div className="content-block gate_fee">
                    <AmountSelector
                        refCallback={this.setNestedRef.bind(this)}
                        label="transfer.fee"
                        disabled={true}
                        amount={this.state.feeAmount.getAmount({real: true})}
                        onChange={this.onFeeChanged.bind(this)}
                        asset={this.state.feeAmount.asset_id}
                        assets={fee_asset_types}
                        tabIndex={tabIndex++}
                    />
                    {!this.state.hasBalance ? <p className="has-error no-margin" style={{paddingTop: 10}}><Translate content="transfer.errors.noFeeBalance" /></p> : null}
                    {!this.state.hasPoolBalance ? <p className="has-error no-margin" style={{paddingTop: 10}}><Translate content="transfer.errors.noPoolBalance" /></p> : null}
                </div> : null}

                {/* Gate fee */}
                {this.props.gateFee ?
                    (<div className="amount-selector right-selector" style={{paddingBottom: 20}}>
                        <label className="left-label"><Translate content="gateway.fee" /></label>
                        <div className="inline-label input-wrapper">
                            <input type="text" disabled value={this.props.gateFee} />

                            <div className="form-label select floating-dropdown">
                                <div className="dropdown-wrapper inactive">
                                    <div>{this.props.output_coin_symbol}</div>
                                </div>
                            </div>
                        </div>
                    </div>):null}
                <div className="content-block">
                    <label className="left-label">
                        <Translate component="span" content="modal.withdraw.address"/>
                    </label>
                    <div className="blocktrades-select-dropdown">
                        <div className="inline-label">
                            <input type="text" value={withdraw_address_selected} tabIndex="4" onChange = {this.onWithdrawAddressChanged.bind(this)} autoComplete="off" />
                            <span onClick={this.onDropDownList.bind(this)} >&#9660;</span>
                        </div>
                    </div>
                    <div className="blocktrades-position-options">
                        {options}
                    </div>
                    {invalid_address_message}
                </div>

                {/* Memo input */}
                {withdraw_memo}

                {/* Withdraw/Cancel buttons */}
                <div className="button-group">

                    <div onClick={this.onSubmit.bind(this)} className={"button" + (this.state.error ? (" disabled") : "")}>
                        <Translate content="modal.withdraw.submit" />
                    </div>

                    <Trigger close={this.props.modal_id}>
                        <div className="button"><Translate content="account.perm.cancel" /></div>
                    </Trigger>
                </div>
				{confirmation}
            </div>
            </form>
	    );
    }
};

export default BindToChainState(WithdrawModalBlocktrades, {keep_updating:true});
