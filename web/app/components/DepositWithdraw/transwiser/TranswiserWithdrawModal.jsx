import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import {ChainStore} from "bitsharesjs/es";
import BindToChainState from "components/Utility/BindToChainState";
import utils from "common/utils";
import BalanceComponent from "components/Utility/BalanceComponent";
import counterpart from "counterpart";
import AmountSelector from "components/Utility/AmountSelector";
import AccountActions from "actions/AccountActions";

class TranswiserWithdrawModal extends React.Component {

   static propTypes = {
       channel:         React.PropTypes.string,
       account:         ChainTypes.ChainAccount.isRequired,
       issuerAccount:   ChainTypes.ChainAccount.isRequired,
       sellAsset:       ChainTypes.ChainAsset.isRequired,
       fee:             React.PropTypes.number.isRequired,
       fee_min:         React.PropTypes.number.isRequired,
       memo_prefix:     React.PropTypes.string,
       modalId:         React.PropTypes.string,
       onModalComplete: React.PropTypes.func,
   }

   constructor( props ) {
      super(props);
      this.state = {
         formValid: false,
         withdraw_amount:null,
         withdraw_address:null,
         withdraw_amount_after_fee:null,
         balance_error:false,
         bank_info: {},
         memo:""
      }

      this.bankFields = ["bank_name", "bank_branch", "bank_account", "bank_holder"];

      let balanceAmount = null;
   }

   onWithdrawAmountChange( {amount, asset} ) {
       if (!this.balanceAmount || this.balanceAmount == 0 || !amount || !asset) {
          this.setState( {
              withdraw_amount: 0,
              withdraw_amount_after_fee: 0,
              balance_error: true
          }, this.checkValidity );
      } else {
          let should_receive = Number(amount.replace(/,/g, ""));
          should_receive = should_receive - Math.max(should_receive * this.props.fee, this.props.fee_min);
          should_receive = Math.floor(should_receive*100)/100;
          console.log(should_receive)
          this.setState( {
              withdraw_amount: amount,
              withdraw_amount_after_fee: should_receive,
              balance_error: amount.replace( /,/g, "" ) > this.balanceAmount
          }, this.checkValidity );
      }
   }

   onWithdrawMemoChanged( e ){
      this.setState({ memo:e.target.value }, this.checkValidity);
   }

   onWithdrawAddressChanged( e ) {
      this.setState( {withdraw_address:e.target.value}, this.checkValidity );
   }

   setBankInfo( field, e ){
      let obj = Object.assign(this.state.bank_info, {[field]: e.target.value}); 
      this.setState( { bank_info: obj }, this.checkValidity ) 
   }

   onSubmit() {
     let asset = this.props.sellAsset;
     let precision = utils.get_asset_precision(asset.get("precision"));
     let amount = this.state.withdraw_amount.replace( /,/g, "" );
     let memo = this.props.memo_prefix || "";
     memo += this.assembleMemo(this.props.channel);
     memo = new Buffer(memo, "utf-8");

     AccountActions.transfer(
         this.props.account.get("id"),
         this.props.issuerAccount.get("id"),
         parseInt(amount * precision, 10),
         asset.get("id"),
         memo
        //  new Buffer((this.props.memo_prefix || "") + this.state.withdraw_address + (this.state.memo != "" ? " (" + this.state.memo + ")" : ""), "utf-8")
     );

     this.props.onModalComplete(this.props.modalId);
   }

   assembleMemo(channel){
     let memo = channel;
     if (channel == "bank_wire"){
       memo += ": " + this.bankFields.map(field => {
         return this.state.bank_info[field]
       }).join("#");
     } else {
       // alipay
       memo += ": " + this.state.withdraw_address + "#" +  this.state.memo;
     } 

     return memo;
   }

   displayFee(){
       return (this.props.fee * 100 + "%");
   }

   checkValidity(){
       let valid = false;
       if (this.props.channel == "bank_wire"){
         // all fields are required
         let bi = this.state.bank_info;
         valid = this.bankFields.every(field => {
           return bi[field] && (bi[field]).trim() != ""
         })
       } else {
         // alipay
         valid = this.state.withdraw_address && this.state.memo.trim() != ""
       }

       // has meaningful withdraw amount
       valid = valid && this.state.withdraw_amount_after_fee > 0
       if (valid !== this.state.formValid){
         this.setState({formValid: valid});
       }
   }

   render() {
       let balance = null;
       let account_balances = this.props.account.get("balances").toJS();
       let asset_types = Object.keys(account_balances);

       if (asset_types.length > 0) {
           let current_asset_id = this.props.sellAsset.get('id');
           if( current_asset_id ){
               balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>);
              if (account_balances[current_asset_id]) {
                  this.balanceAmount = parseInt(ChainStore.getObject(account_balances[current_asset_id]).get('balance'))/Math.pow(10,parseInt(this.props.sellAsset.get('precision')));
              }
           } else {
              balance = "No funds";
              this.balanceAmount = 0;
           }
       } else {
           balance = "No funds";
           this.balanceAmount = 0;
       }

       return (<form className="grid-block vertical full-width-content">
                 <div className="grid-container">
                   <div className="content-block">
                      <h3><Translate content="gateway.transwiser.withdraw_title" channel={counterpart.translate("gateway.transwiser.channel.withdraw."+this.props.channel)} asset={this.props.sellAsset.get('symbol')} /></h3>
                   </div>
                   <div className="content-block hide">
                       <p><Translate content="gateway.transwiser.withdraw_note" /></p>
                   </div>
                   <div className="content-block">
                     <AmountSelector label="modal.withdraw.amount"
                                     amount={this.state.withdraw_amount}
                                     asset={this.props.sellAsset.get('id')}
                                     assets={[this.props.sellAsset.get('id')]}
                                     placeholder="0.0"
                                     onChange={this.onWithdrawAmountChange.bind(this)}
                                     display_balance={balance}
                                     tabIndex={1}
                                     />
                                     {
                                         this.state.balance_error ?
                                         <div className="has-error"><Translate content="transfer.errors.insufficient" /></div> :
                                         null
                                     }
                        <br />
                        <div className="grid-block">
                            <Translate content="gateway.transwiser.fee" />: {this.displayFee()}&nbsp;
                            <Translate content="gateway.transwiser.fee_min" />: {this.props.fee_min}&nbsp; 
                            { this.state.withdraw_amount_after_fee >= 0 ? <span> (<Translate content="gateway.transwiser.you_will_receive" amount={this.state.withdraw_amount_after_fee} />)</span> : null }
                        </div>
                   </div>

                   { this.props.channel == "bank_wire" ? (
                     <div>
                        {this.bankFields.map(field => {
                            return (
                                <div className="content-block full-width-content" key={field}>
                                    <label><Translate component="span" content={"gateway.transwiser."+field}/></label>
                                    <input type="text" onChange={this.setBankInfo.bind(this, field)} autoComplete="off" required/>
                                </div>
                            )
                        })}
                     </div>
                   ) : (
                     /* alipay elements */
                     <div>
                        <div className="content-block full-width-content">
                        <label><Translate component="span" content="gateway.transwiser.alipay_account"/></label>
                        <input type="text" value={this.state.withdraw_address || ""} tabIndex="2" onChange={this.onWithdrawAddressChanged.bind(this)} autoComplete="off"/>
                        <div className="grid-block">
                            <Translate content="gateway.transwiser.alipay_account_name_notice" />
                        </div>
                        </div>
                        <div className="content-block full-width-content">
                        <label><Translate component="span" content="gateway.transwiser.alipay_realname"/></label>
                        <input type="text" value={this.state.memo || ""} tabIndex="3" onChange={this.onWithdrawMemoChanged.bind(this)} autoComplete="off"/>
                        </div>  
                     </div>  
                   )}

                   <div className="content-block">
                     <input type="submit" className="button {!this.state.formValid ? 'disabled' : ''}" 
                            disabled={!this.state.formValid}
                            onClick={this.onSubmit.bind(this)}
                            value={counterpart.translate("modal.withdraw.submit")} />
                       <Trigger close={this.props.modalId}>
                           <div className="button"><Translate content="account.perm.cancel" /></div>
                       </Trigger>
                   </div>
                 </div>
               </form>)
   }
};

export default BindToChainState(TranswiserWithdrawModal, {keep_updating:true});
