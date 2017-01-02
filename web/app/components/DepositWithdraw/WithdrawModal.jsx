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

class WithdrawModal extends React.Component {

   static propTypes = {
       account: ChainTypes.ChainAccount.isRequired,
       issuer: ChainTypes.ChainAccount.isRequired,
       asset: ChainTypes.ChainAsset.isRequired,
       receive_asset_name: React.PropTypes.string,
       receive_asset_symbol: React.PropTypes.string,
       memo_prefix: React.PropTypes.string
   }

   constructor( props ) {
      super(props);
      this.state = {
         withdraw_amount:null,
         withdraw_address:null
      }
   }

   onWithdrawAmountChange( {amount, asset} ) {
      this.setState( {withdraw_amount:amount} );
   }

   onWithdrawAddressChanged( e ) {
      this.setState( {withdraw_address:e.target.value} );
   }

   onSubmit() {
     let asset = this.props.asset;
     let precision = utils.get_asset_precision(asset.get("precision"));
     let amount = this.state.withdraw_amount.replace( /,/g, "" )
     console.log( "withdraw_amount: ", amount );
     AccountActions.transfer(
         this.props.account.get("id"),
         this.props.issuer.get("id"),
         parseInt(amount * precision, 10),
         asset.get("id"),
         (this.props.memo_prefix || "") + this.state.withdraw_address
     )
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


       return (<form className="grid-block vertical full-width-content">
                 <div className="grid-container">
                   <div className="content-block">
                      <h3>Withdraw {this.props.receive_asset_name}({this.props.receive_asset_symbol})</h3>
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
                   <div className="content-block full-width-content">
                       <label><Translate component="span" content="modal.withdraw.address"/></label>
                       <input type="text" value={this.state.withdraw_address} tabIndex="4" onChange={this.onWithdrawAddressChanged.bind(this)} autoComplete="off"/>
                       {/*<div>{memo_error}</div>*/}
                   </div>

                   <div className="content-block">
                     <input type="submit" className="button"
                            onClick={this.onSubmit.bind(this)}
                            value={counterpart.translate("modal.withdraw.submit")} />
                       <Trigger close={this.props.modal_id}>
                           <div className="button"><Translate content="account.perm.cancel" /></div>
                       </Trigger>
                   </div>
                 </div>
               </form>)
   }

};

export default BindToChainState(WithdrawModal, {keep_updating:true});
