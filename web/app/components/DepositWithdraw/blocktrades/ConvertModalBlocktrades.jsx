import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
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
        output_wallet_type: React.PropTypes.string,
		conversion_memo: React.PropTypes.string
    };

    constructor( props ) {
        super(props);
		
        this.state = {
        convert_amount: null
        }
    }

    onConvertAmountChange( {amount, asset} ) {
        this.setState( {convert_amount: amount} );
    }

    onSubmit() {

	}

    render() {
	
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
