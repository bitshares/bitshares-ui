import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import utils from "common/utils";
import BalanceComponent from "components/Utility/BalanceComponent";
import WalletDb from "stores/WalletDb";
import counterpart from "counterpart";
import AmountSelector from "components/Utility/AmountSelector";
import AccountActions from "actions/AccountActions";
import Post from "common/formPost";

@BindToChainState({keep_updating:true})
class WithdrawModalMetaexchange extends React.Component {

	static propTypes = 
	{
		gateway: React.PropTypes.string,
		api_root: React.PropTypes.string,
		order_type: React.PropTypes.string,
		symbol_pair: React.PropTypes.string,
		account: ChainTypes.ChainAccount.isRequired,
		issuer: ChainTypes.ChainAccount.isRequired,
		asset: ChainTypes.ChainAsset.isRequired,
		receive_asset_name: React.PropTypes.string,
		receive_asset_symbol: React.PropTypes.string,
		is_bts_withdraw: React.PropTypes.string,
	};

   constructor( props ) {
      super(props);
	  
	  var withdrawAddress = this.updateWithdrawalAddress();
	  
	  let parts = props.symbol_pair.split('_');
		
      this.state = {
		base_symbol:parts[0],
		quote_symbol:parts[1],
		withdraw_amount:null,
		withdraw_address: withdrawAddress,
		memo:null,
		deposit_address: "",
		withdraw_address: "",
		quote_amount:1,
		quote:"fetching...",
		limit:"fetching..."
      }
   }

   componentDidMount() {
        if (this.props.is_bts_withdraw) {
            Post.PostForm(this.props.api_root+"/1/getMarket", {symbol_pair:this.props.symbol_pair})
            .then( reply => reply.json()
                .then(reply=> {
                    // console.log(reply);
                    this.setState( {limit:reply.bid_max} );

                    this.updateQuote(1);
                })
            ).catch(err => {
            console.log("PostForm error:", err);
            });
        }
   }
   
	updateWithdrawalAddress()
	{
		var withdrawAddress = null
		let wallet = WalletDb.getWallet();
		try
		{
			withdrawAddress = wallet.deposit_keys[this.props.gateway][this.state.base_symbol]['withdraw_address'];				
			this.onWithdrawAddressChanged({target:{value:withdrawAddress}});
		}
		catch (Error){}
		return withdrawAddress;
	}
   
   updateQuote(amount)
   {
		this.setState( {quote:"fetching...", quote_amount:amount});
		
		Post.PostForm(this.props.api_root+"/2/getQuote", {symbol_pair:this.props.symbol_pair,order_type:'sell',deposit_amount:amount})
        .then( reply=> reply.json()
            .then(reply=> {
				// console.log(reply);
				this.setState( {quote:reply.result} );
			})
        ).catch(err => {
            console.log("PostForm getQuote error:", err);
        });
   }

	onWithdrawAmountChange( {amount, asset} ) 
	{
		this.setState( {withdraw_amount:amount} );
		this.updateQuote(amount);
	}

	onWithdrawAddressChanged( e ) 
	{
		this.setState({
			withdraw_address: e.target.value
		});

		let wallet = WalletDb.getWallet();
		wallet.deposit_keys[this.props.gateway][this.state.base_symbol]['withdraw_address'] = e.target.value;
		WalletDb._updateWallet();
		
		// shoot off to metaexchange to request a memo/deposit address
		Post.PostForm(	this.props.api_root+'/1/submitAddress',
						{
							receiving_address:e.target.value,
							symbol_pair:this.props.symbol_pair,
							order_type:this.props.order_type
						}).then( reply=>reply.json().then(reply=>
						{
							// console.log(reply);
							if (reply.error)
							{
								this.setState( {api_error:reply.message, memo:null} );
							}
							else
							{
								// this.props.issuer = reply.deposit_address;
								var apiReply = {api_error:"", memo:reply.memo, deposit_address:reply.deposit_address};
								this.setState( apiReply );
							}
						}))
						.catch(err => {
							console.log("metax post error:", err);
						});
	}

	onSubmit() 
	{
		let amount = this.state.withdraw_amount.replace( /,/g, "" )
		
		if (this.state.memo)
		{
			let sendTo = ChainStore.getAccount(this.state.deposit_address);
			let asset = this.props.asset;
			let precision = utils.get_asset_precision(asset.get("precision"));
			
			// console.log( "withdraw_amount: ", amount );
			AccountActions.transfer(
				this.props.account.get("id"),
				sendTo.get('id'),
				parseInt(amount * precision, 10),
				asset.get("id"),
				this.state.memo)
		}
		else if (amount > 0)
		{
			this.setState( {api_error:"Processing..."} );
			
			this.updateWithdrawalAddress();
		}
	}
	
	render() {
       let balance = null;
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

	   let quotePart = null, limitPart = null, titlePart = null;
		if (this.props.is_bts_withdraw)
		{
			quotePart = <p>{this.state.quote_amount} BTS = {this.state.quote} BTC</p>
			limitPart = <div style={{paddingTop: 10}}>There is a withdrawal limit of {this.state.limit} {this.props.receive_asset_symbol}</div>
			titlePart = <h3>Withdraw to Bitcoin</h3>
		}
		else
		{
			quotePart = "";
			limitPart = "";
			titlePart = <h3>Withdraw {this.props.receive_asset_name} ({this.props.receive_asset_symbol})</h3>
		}

       return (<form className="grid-block vertical full-width-content">
                 <div className="grid-container">
                   <div className="content-block">
                      {titlePart}
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
					{limitPart}
					{quotePart}
                   </div>
                   <div className="content-block full-width-content">
                        <label><Translate component="span" content="modal.withdraw.address"/></label>
                        <input
                       		type="text"
                       		value={this.state.withdraw_address}
                       		tabIndex="4"
                       		onChange={this.onWithdrawAddressChanged.bind(this)}
                       		autoComplete="off"
                   		/>
						<div className="has-error error-area">{this.state.api_error}</div>
                   </div>
                                  
                   <div className="content-block">
                     	<input 
	                     	type="submit"
	                 		className="button" 
	                        onClick={this.onSubmit.bind(this)} 
	                        value={counterpart.translate("modal.withdraw.submit")}
	                    />
                       <Trigger close={this.props.modal_id}>
                           <div className="button"><Translate content="account.perm.cancel" /></div>
                       </Trigger>
                   </div>
                 </div> 
               </form>)
   }
   
};

export default WithdrawModalMetaexchange
