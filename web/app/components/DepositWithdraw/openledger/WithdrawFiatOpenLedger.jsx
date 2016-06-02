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

@BindToChainState({keep_updating:true})
class WithdrawFiatOpenLedger extends React.Component {

   static propTypes = {
       account: ChainTypes.ChainAccount.isRequired,
       issuer_account: ChainTypes.ChainAccount.isRequired,
       deposit_asset: React.PropTypes.string,
       receive_asset: ChainTypes.ChainAsset.isRequired,
       rpc_url: React.PropTypes.string
   }

   constructor( props ) {
      super(props);
      this.state = {
         withdraw_amount: null
      }
   }

   onWithdrawAmountChange( {amount, asset} ) {
      this.setState( {withdraw_amount:amount} );
   }

   onSubmit() {
     let asset = this.props.receive_asset;
     let precision = utils.get_asset_precision(asset.get("precision"));
     let amount = this.state.withdraw_amount.replace( /,/g, "" )

     let json_rpc_request = {
      "jsonrpc": "2.0", 
      "method": "getMemoForFiatWithdrawal", 
      "params": {
         "bitsharesAccountName": this.props.account.get('name'), 
         "currency": this.props.deposit_asset, 
         "amount": amount 
      }, 
      "id": 1 
     };
     let is_withdrawal_approved_promise = fetch(this.props.rpc_url,
                                                {method: 'POST', 
                                                 headers: new Headers({"Accept": "application/json", 
                                                 "content-type":"application/x-www-form-urlencoded"}), 
                                                 body: 'rq=' + encodeURIComponent(JSON.stringify(json_rpc_request)) })
                                          .then(response => response.json());
        
     is_withdrawal_approved_promise.then((json_response) => {
            if ('result' in json_response)
              AccountActions.transfer(
                  this.props.account.get("id"),
                  this.props.issuer_account.get("id"),
                  parseInt(amount * precision, 10),
                  asset.get("id"),
                  json_response.result);
            else if ('error' in json_response && 'message' in json_response.error)
               throw json_repsonse.error.message;
            else
               throw 'Unable to approve withdrawal, please contact OpenLedger or try again later';
        })
        .catch((error) => {
            alert(error);
        })
   }

   render() {
       let balance = null;
       // console.log( "account: ", this.props.account.toJS() );
       let account_balances = this.props.account.get("balances").toJS();
       // console.log( "balances: ", account_balances );
       let asset_types = Object.keys(account_balances);

       if (asset_types.length > 0) {
           let current_asset_id = this.props.receive_asset.get('id');
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
                      <h3>Withdraw {this.props.deposit_asset}</h3>
                   </div>
                   <div className="content-block">
                     <AmountSelector label="modal.withdraw.amount" 
                                     amount={this.state.withdraw_amount}
                                     asset={this.props.receive_asset.get('id')}
                                     assets={[this.props.receive_asset.get('id')]}
                                     placeholder="0.0"
                                     onChange={this.onWithdrawAmountChange.bind(this)}
                                     display_balance={balance}
                                     />
                   </div>
                                  
                   <div className="content-block">
                     <input type="submit" className="button" 
                            onClick={this.onSubmit.bind(this)} 
                            value={counterpart.translate("modal.withdraw.submit")} />
                       <Trigger close={this.props.modal_id}>
                           <a href className=" button"><Translate content="account.perm.cancel" /></a>
                       </Trigger>
                   </div>
                 </div> 
               </form>)
   }
   
};

export default WithdrawFiatOpenLedger
