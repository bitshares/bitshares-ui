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
import { blockTradesAPIs } from "api/apiConfig";



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
            from_error: null,
            asset: null,
            feeAsset: null,
            fee_asset_id: "1.3.0"
        };


        this._validateAddress(this.state.withdraw_address, props);
    }

    onMemoChanged( e ) {
        this.setState( {memo: e.target.value} );
    }

    onWithdrawAmountChange( {amount} ) {
        this.setState({
            withdraw_amount: amount,
            empty_withdraw_value: !parseFloat(amount)
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
    				// localStorage.setItem(`history_address_${this.props.output_wallet_type}`, JSON.stringify(withdrawals));
                } else {

                    let withdrawals = WithdrawAddresses.get(this.props.output_wallet_type);
    		        // let withdrawals = JSON.parse(localStorage.getItem(`history_address_${this.props.output_wallet_type}`));
    		        if (withdrawals.indexOf(this.state.withdraw_address) == -1) {

    	                withdrawals.push(this.state.withdraw_address);
                        WithdrawAddresses.set({wallet: this.props.output_wallet_type, addresses: withdrawals});
    					// localStorage.setItem(`history_address_${this.props.output_wallet_type}`, JSON.stringify(withdrawals));
    	            }
    	        }
                WithdrawAddresses.setLast({wallet: this.props.output_wallet_type, address: this.state.withdraw_address});
                // lStorage.setItem(`history_address_last_${this.props.output_wallet_type}`, this.state.withdraw_address);
                let asset = this.props.asset;
                let precision = utils.get_asset_precision(asset.get("precision"));
                let amount = String.prototype.replace.call(this.state.withdraw_amount, /,/g, "");

                let { fee_asset_types } = this._getAvailableAssets();
                let {feeAsset} = this.state;
                let fee_asset_choosen=this.state.feeAsset.get("id");
                if(fee_asset_types.indexOf(fee_asset_choosen)==-1){
                    feeAsset =  ChainStore.getAsset(fee_asset_types[0])
                }

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
			// localStorage.setItem(`history_address_${this.props.output_wallet_type}`, JSON.stringify(withdrawals));

        } else {
            let withdrawals = WithdrawAddresses.get(this.props.output_wallet_type);
			// let withdrawals = JSON.parse(localStorage.getItem(`history_address_${this.props.output_wallet_type}`));
		    if (withdrawals.indexOf(this.state.withdraw_address) == -1) {
		        withdrawals.push(this.state.withdraw_address);
                WithdrawAddresses.set({wallet: this.props.output_wallet_type, addresses: withdrawals});
				// localStorage.setItem(`history_address_${this.props.output_wallet_type}`, JSON.stringify(withdrawals));
	        }
	    }
        WithdrawAddresses.setLast({wallet: this.props.output_wallet_type, address: this.state.withdraw_address});
		// localStorage.setItem(`history_address_last_${this.props.output_wallet_type}`, this.state.withdraw_address);
        let asset = this.props.asset;
        let precision = utils.get_asset_precision(asset.get("precision"));
        let amount = String.prototype.replace.call(this.state.withdraw_amount, /,/g, "");

        let { fee_asset_types } = this._getAvailableAssets();
        let {feeAsset} = this.state;
        let fee_asset_choosen=this.state.feeAsset.get("id");
        if(fee_asset_types.indexOf(fee_asset_choosen)==-1){
            feeAsset =  ChainStore.getAsset(fee_asset_types[0])
        }
      
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

    onAccountBalance({fee,feeID,total_precision}) {

        if (Object.keys(this.props.account.get("balances").toJS()).includes(this.props.asset.get("id")) ) {
            let total_minus_fee = this.props.balance.get("balance") / utils.get_asset_precision(this.props.asset.get("precision"));
            if(this.props.asset.get("id")==feeID){
                total_minus_fee=utils.limitByPrecision(total_minus_fee-fee*1.095,total_precision); //@#>
                if(total_minus_fee<0){
                    total_minus_fee=0;
                }
            }

            this.setState({
                withdraw_amount: total_minus_fee,
                //withdraw_amount: this.props.balance.get("balance") / utils.get_asset_precision(this.props.asset.get("precision")),
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
        this.setState({feeAsset: asset, error: null});
    }

    _getAvailableAssets(state = this.state) {
        const { from_account, from_error } = state;
        let asset_types = [];
        let fee_asset_types = [];

        if (!(from_account && from_account.get("balances") && !from_error)) {
            return {asset_types, fee_asset_types};
        }
        let account_balances = state.from_account.get("balances").toJS();

        for (let key in account_balances) {
            let asset = ChainStore.getObject(key);
            let balanceObject = account_balances[key]?ChainStore.getObject(account_balances[key]):null;

            if (balanceObject && balanceObject.get("balance") > 0) {
                if(fee_asset_types.indexOf(key)==-1){
                    asset_types.push(key);
                }
            }

            if(asset&&utils.isValidPrice(asset.getIn(["options", "core_exchange_rate"]))&&parseInt(asset.getIn(["dynamic", "fee_pool"]), 10)>(this._feeBTS||2200)){
                fee_asset_types.push(key);
            }

        }

        return {asset_types, fee_asset_types};
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
        const { from_account, from_error, fee_asset_id } = this.state;
        let feeAsset = this.state.feeAsset;
        let asset = this.state.asset;
        let fee = this._feeBTS = utils.estimateFee("transfer", null, ChainStore.getObject("2.0.0"));
        let { fee_asset_types } = this._getAvailableAssets();
        let balance_fee = null;
        let feeID = feeAsset ? feeAsset.get("id") : "1.3.0";
        let core = ChainStore.getObject("1.3.0");

        if(fee_asset_types.indexOf(fee_asset_choosen)==-1){
            feeAsset =  ChainStore.getAsset(fee_asset_types[0])
        }

        // Estimate fee

        if (from_account && from_account.get("balances") && !from_error) {

            let account_balances = from_account.get("balances").toJS();

            // Finish fee estimation
            if (feeAsset && feeAsset.get("id") !== "1.3.0" && core) {

                let price = utils.convertPrice(core, feeAsset.getIn(["options", "core_exchange_rate"]).toJS(), null, feeAsset.get("id"));
                fee = utils.convertValue(price, fee, core, feeAsset);

                if (parseInt(fee, 10) !== fee) {
                    fee += 1; // Add 1 to round up;
                }
            }
            if (core) {
                fee = utils.limitByPrecision(utils.get_asset_amount(fee, feeAsset || core), feeAsset ? feeAsset.get("precision") : core.get("precision"));
            }

            if (asset_types.length === 1) asset = ChainStore.getAsset(asset_types[0]);
            if (asset_types.length > 0) {
                let current_asset_id = asset ? asset.get("id") : asset_types[0];
                balance_fee = (<span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this._setTotal.bind(this, current_asset_id, account_balances[current_asset_id], fee, feeID)}><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>);
            } else {
                balance_fee = "No funds";
            }
        } else {
            fee_asset_types = ["1.3.0"];
            if (core) {
                fee = utils.limitByPrecision(utils.get_asset_amount(fee, feeAsset || core), feeAsset ? feeAsset.get("precision") : core.get("precision"));
            }
        }

        let total_precision = feeAsset ? feeAsset.get("precision") : core.get("precision");

        if (asset_types.length > 0) {
            let current_asset_id = this.props.asset.get("id");
            if( current_asset_id )
                balance = (<span><Translate component="span" content="transfer.available"/>: <span className="set-cursor" onClick={()=>{this.onAccountBalance({fee,feeID,total_precision})}}><BalanceComponent balance={account_balances[current_asset_id]}/></span></span>);
            else
                balance = "No funds";
        } else {
            balance = "No funds";
        }

        let fee_asset_choosen="1.3.0";
        if(this.state.feeAsset){
            fee_asset_choosen=this.state.feeAsset.get("id");
            if(fee_asset_types.indexOf(fee_asset_choosen)==-1){
                fee_asset_choosen = fee_asset_types[0]
            }
        }



        return (<form className="grid-block vertical full-width-content">
            <div className="grid-container">
                <div className="content-block">
                    <h3><Translate content="gateway.withdraw_coin" coin={this.props.output_coin_name} symbol={this.props.output_coin_symbol} /></h3>
                </div>
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
                <div className="content-block gate_fee">
                    <AmountSelector
                        refCallback={this.setNestedRef.bind(this)}
                        label="transfer.fee"
                        disabled={true}
                        amount={fee}
                        onChange={this.onFeeChanged.bind(this)}
                        asset={fee_asset_choosen}
                        assets={fee_asset_types}
                        tabIndex={tabIndex++}
                    />
                    {this.props.gateFee?
                        (<div className="amount-selector right-selector">
                            <label className="left-label">Gate fee</label>
                            <div className="inline-label input-wrapper">
                                <p className="right-selector-input" >{this.props.gateFee}</p>
                            </div>
                        </div>):null}
                </div>

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
                {withdraw_memo}
                <div className="content-block">

                    <a onClick={this.onSubmit.bind(this)} className="button white_color_a"><Translate content="modal.withdraw.submit" /></a>

                    <Trigger close={this.props.modal_id}>
                        <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                    </Trigger>
                </div>
				{confirmation}
            </div>
            </form>
	    );
    }
};

export default BindToChainState(WithdrawModalBlocktrades, {keep_updating:true});
