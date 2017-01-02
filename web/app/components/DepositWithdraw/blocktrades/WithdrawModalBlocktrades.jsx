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
import Modal from "react-foundation-apps/src/modal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";

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
		output_supports_memos: React.PropTypes.bool.isRequired
    };

    constructor( props ) {
        super(props);

        fetch(this.props.url + '/wallets/' + this.props.output_wallet_type + '/address-validator?address=' + encodeURIComponent(localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) !== null ? localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) : ''),
            {
            method: 'get',
            headers: new Headers({"Accept": "application/json"})
            }).then(reply => { reply.json().then( json =>
            {
                // only process it if the user hasn't changed the address
                // since we initiated the request
                if (this.state.withdraw_address === localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) !== null ? localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) : '')
                {
                    this.setState(
                    {
                    withdraw_address_check_in_progress: false,
                    withdraw_address_is_valid: json.isValid
                    });
                }
            })});

        this.state = {
        withdraw_amount: null,
        withdraw_address: localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) !== null ? localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) : '',
        withdraw_address_check_in_progress: true,
		withdraw_address_is_valid: null,
	    options_is_valid: false,
		confirmation_is_valid: false,
		withdraw_address_selected: localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) !== null ? localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) : '',
		memo: '',
		withdraw_address_first: true
        }
    }

    onMemoChanged( e ) {
	    this.setState( {memo: e.target.value} );
    }

    onWithdrawAmountChange( {amount, asset} ) {
        this.setState( {withdraw_amount:amount} );
    }

    onSelectChanged(index, e) {

		let new_withdraw_address = JSON.parse(localStorage.getItem(`history_address_${this.props.output_wallet_type}`))[index];
		localStorage.setItem(`history_address_last_${this.props.output_wallet_type}`, JSON.parse(localStorage.getItem(`history_address_${this.props.output_wallet_type}`))[index]);

        fetch(this.props.url + '/wallets/' + this.props.output_wallet_type + '/address-validator?address=' + encodeURIComponent(new_withdraw_address),
            {
            method: 'get',
            headers: new Headers({"Accept": "application/json"})
            }).then(reply => { reply.json().then( json =>
            {
                // only process it if the user hasn't changed the address
                // since we initiated the request
                if (this.state.withdraw_address === new_withdraw_address)
                {
                    this.setState(
                    {
                    withdraw_address_check_in_progress: false,
                    withdraw_address_is_valid: json.isValid
                    });
                }
            })});

	        this.setState(
	        {
			withdraw_address_selected: new_withdraw_address,
			options_is_valid: false,
			withdraw_address: new_withdraw_address,
            withdraw_address_check_in_progress: true,
            withdraw_address_is_valid: null
		    });
    }

    onWithdrawAddressChanged( e ) {

        let new_withdraw_address = e.target.value.trim();

        fetch(this.props.url + '/wallets/' + this.props.output_wallet_type + '/address-validator?address=' + encodeURIComponent(new_withdraw_address),
            {
            method: 'get',
            headers: new Headers({"Accept": "application/json"})
            }).then(reply => { reply.json().then( json =>
            {
                // only process it if the user hasn't changed the address
                // since we initiated the request
                if (this.state.withdraw_address === new_withdraw_address)
                {
                this.setState(
                    {
                    withdraw_address_check_in_progress: false,
                    withdraw_address_is_valid: json.isValid
                    });
                }
            })});

            this.setState(
            {
            withdraw_address: new_withdraw_address,
            withdraw_address_check_in_progress: true,
			withdraw_address_selected: new_withdraw_address,
            withdraw_address_is_valid: null
            });
    }

    onSubmit() {

        if ((!this.state.withdraw_address_check_in_progress) && (this.state.withdraw_address && this.state.withdraw_address.length) && (this.state.withdraw_amount !== null)) {

            if (!this.state.withdraw_address_is_valid) {

				ZfApi.publish(this.getWithdrawModalId(), "open");
	        } else {

		   if (localStorage.getItem(`history_address_${this.props.output_wallet_type}`) == null) {

		        let withdrawals = [];
				withdrawals.push(this.state.withdraw_address);
				localStorage.setItem(`history_address_${this.props.output_wallet_type}`, JSON.stringify(withdrawals));
            } else {

		        let withdrawals = JSON.parse(localStorage.getItem(`history_address_${this.props.output_wallet_type}`));
		        if (withdrawals.indexOf(this.state.withdraw_address) == -1) {

	                withdrawals.push(this.state.withdraw_address);
					localStorage.setItem(`history_address_${this.props.output_wallet_type}`, JSON.stringify(withdrawals));
	            }
	        }
	  	    localStorage.setItem(`history_address_last_${this.props.output_wallet_type}`, this.state.withdraw_address);
            let asset = this.props.asset;
            let precision = utils.get_asset_precision(asset.get("precision"));
            let amount = this.state.withdraw_amount.replace( /,/g, "" )
            console.log( "withdraw_amount: ", amount );
            AccountActions.transfer(
            this.props.account.get("id"),
            this.props.issuer.get("id"),
            parseInt(amount * precision, 10),
            asset.get("id"),
	    	this.state.memo ? this.props.output_coin_type + ":" + this.state.withdraw_address + ":" + new Buffer(this.state.memo, "utf-8") : this.props.output_coin_type + ":" + this.state.withdraw_address
		    //this.props.output_coin_type + ":" + this.state.withdraw_address
            )}

        }
	}

    onSubmitConfirmation() {

        ZfApi.publish(this.getWithdrawModalId(), "close");

        if (localStorage.getItem(`history_address_${this.props.output_wallet_type}`) == null) {
	        let withdrawals = [];
			withdrawals.push(this.state.withdraw_address);
			localStorage.setItem(`history_address_${this.props.output_wallet_type}`, JSON.stringify(withdrawals));

        } else {

			let withdrawals = JSON.parse(localStorage.getItem(`history_address_${this.props.output_wallet_type}`));
		    if (withdrawals.indexOf(this.state.withdraw_address) == -1) {
		        withdrawals.push(this.state.withdraw_address);
				localStorage.setItem(`history_address_${this.props.output_wallet_type}`, JSON.stringify(withdrawals));
	        }
	    }
		localStorage.setItem(`history_address_last_${this.props.output_wallet_type}`, this.state.withdraw_address);
        let asset = this.props.asset;
        let precision = utils.get_asset_precision(asset.get("precision"));
        let amount = this.state.withdraw_amount.replace( /,/g, "" )
        console.log( "withdraw_amount: ", amount );
        AccountActions.transfer(
        this.props.account.get("id"),
        this.props.issuer.get("id"),
        parseInt(amount * precision, 10),
        asset.get("id"),
	    this.state.memo ? this.props.output_coin_type + ":" + this.state.withdraw_address + ":" + new Buffer(this.state.memo, "utf-8") : this.props.output_coin_type + ":" + this.state.withdraw_address
	    //this.props.output_coin_type + ":" + this.state.withdraw_address
        )
    }

    onDropDownList() {

		if (JSON.parse(localStorage.getItem(`history_address_${this.props.output_wallet_type}`)) != null) {

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

    render() {

	    let {withdraw_address_selected, memo} = this.state;
	    let storedAddress = [];
	    if (JSON.parse(localStorage.getItem(`history_address_${this.props.output_wallet_type}`)) != null) {
		    storedAddress = JSON.parse(localStorage.getItem(`history_address_${this.props.output_wallet_type}`));
	    }
        let balance = null;
		let style_select = "blocktrades-options";

        // console.log( "account: ", this.props.account.toJS() );
        let account_balances = this.props.account.get("balances").toJS();
        // console.log( "balances: ", account_balances );
        let asset_types = Object.keys(account_balances);

        if (asset_types.length > 0) {
            let current_asset_id = this.props.asset.get('id');
            if( current_asset_id )
                balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>)
            else
                balance = "No funds";
        } else {
            balance = "No funds";
        }

	    let withdrawModalId = this.getWithdrawModalId();
        let invalid_address_message = null;
	    let options = null;
	    let confirmation = null;
		if (storedAddress.length == 0) {
			style_select = "blocktrades-disabled-options";
		}

	    if (this.state.options_is_valid) {
	        options =
			    <div className={style_select}>
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

        return (<form className="grid-block vertical full-width-content">
            <div className="grid-container">
                <div className="content-block">
                    <h3><Translate content="gateway.withdraw_coin" coin={this.props.output_coin_name} symbol={this.props.output_coin_symbol} /></h3>
                </div>
                <div className="content-block">
                    <AmountSelector label="modal.withdraw.amount"
                        amount={this.state.withdraw_amount}
                        asset={this.props.asset.get('id')}
                        assets={[this.props.asset.get('id')]}
                        placeholder="0.0"
                        onChange={this.onWithdrawAmountChange.bind(this)}
                        display_balance={balance}
                    />
                </div>
                <div className="content-block">
                    <label><Translate component="span" content="modal.withdraw.address"/></label>
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
                    <input type="submit" className="button"
                    onClick={this.onSubmit.bind(this)}
                    value={counterpart.translate("modal.withdraw.submit")} />
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
