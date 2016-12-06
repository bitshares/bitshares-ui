import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import utils from "common/utils";
import SettingsActions from "actions/SettingsActions";
import BalanceComponent from "components/Utility/BalanceComponent";
import counterpart from "counterpart";
import AmountSelector from "components/Utility/AmountSelector";

@BindToChainState({keep_updating:true})
class ConvertModalBlocktrades extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        issuer: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired, 
        output_coin_name: React.PropTypes.string.isRequired,
        output_coin_symbol: React.PropTypes.string.isRequired,
        output_coin_type: React.PropTypes.string.isRequired,
        url: React.PropTypes.string,
        output_wallet_type: React.PropTypes.string
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
                if (this.state.convert_address === localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) !== null ? localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) : '')
                {
                    this.setState(
                    {
                    convert_address_check_in_progress: false,
                    convert_address_is_valid: json.isValid
                    });
                }
            })});
		
        this.state = {
        convert_amount: null,
        convert_address: localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) !== null ? localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) : '',
        convert_address_check_in_progress: true,
		convert_address_is_valid: null,
		convert_address_selected: localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) !== null ? localStorage.getItem(`history_address_last_${this.props.output_wallet_type}`) : ''
        }
    }

    onConvertAmountChange( {amount, asset} ) {
        this.setState( {convert_amount: amount} );
    }

    onConvertAddressChanged( e ) {

        let new_convert_address = e.target.value.trim();

        fetch(this.props.url + '/wallets/' + this.props.output_wallet_type + '/address-validator?address=' + encodeURIComponent(new_convert_address),
            {
            method: 'get',
            headers: new Headers({"Accept": "application/json"})
            }).then(reply => { reply.json().then( json =>
            {
                // only process it if the user hasn't changed the address
                // since we initiated the request
                if (this.state.convert_address === new_convert_address)
                {
                this.setState(
                    {
                    convert_address_check_in_progress: false,
                    convert_address_is_valid: json.isValid
                    });
                }
            })});

            this.setState( 
            {
            convert_address: new_convert_address,
            convert_address_check_in_progress: true,
			convert_address_selected: new_convert_address,
            convert_address_is_valid: null
            });
    }

    onSubmit() { 

	}

    render() {		
	
	    let {convert_address_selected} = this.state;

        let balance = null;
        let account_balances = this.props.account.get("balances").toJS();
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
       
        let invalid_address_message = null;
	   
        if (!this.state.convert_address_check_in_progress && this.state.convert_address && this.state.convert_address.length)
        {
            if (!this.state.convert_address_is_valid) {
				invalid_address_message = <div className="has-error" style={{paddingTop: 10}}><Translate content="gateway.valid_address" coin_type={this.props.output_coin_type} /></div>;
		    }
        }
	   
	    let tabIndex = 1;

        return (<form className="grid-block vertical full-width-content">
            <div className="grid-container">
                <div className="content-block">
                    <h3><Translate content="gateway.convert_coin" coin={this.props.output_coin_name} symbol={this.props.output_coin_symbol} /></h3>
                </div>
                <div className="content-block">
                    <AmountSelector label="modal.convert.amount" 
                        amount={this.state.convert_amount}
                        asset={this.props.asset.get('id')}
                        assets={[this.props.asset.get('id')]}
                        placeholder="0.0"
                        onChange={this.onConvertAmountChange.bind(this)}
                        display_balance={balance}
                    />
                </div>
                <div className="content-block">
                    <label><Translate component="span" content="modal.convert.address"/></label> 
					<div className="inline-label">
						<input type="text" value={convert_address_selected} tabIndex="4" onChange = {this.onConvertAddressChanged.bind(this)} autoComplete="off" />
					</div>
					{invalid_address_message}                
                </div>
                <div className="content-block">
                    <input type="submit" className="button" 
                    onClick={this.onSubmit.bind(this)} 
                    value={counterpart.translate("modal.convert.submit")} />
                    <Trigger close={this.props.modal_id}>
                        <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                    </Trigger>
                </div>
            </div> 
            </form>
	    )
    }  
};

export default ConvertModalBlocktrades;
