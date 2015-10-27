import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import LoadingIndicator from "../LoadingIndicator";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Statistics from "./Statistics";
import AccountActions from "actions/AccountActions";
import Icon from "../Icon/Icon";
import TimeAgo from "../Utility/TimeAgo";
import HelpContent from "../Utility/HelpContent";
import WalletDb from "stores/WalletDb";
import AmountSelector from "../Utility/AmountSelector";
import WithdrawModal from "../Modal/WithdrawModal";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../Account/AccountBalance";
import BalanceComponent from "../Utility/BalanceComponent";


@BindToChainState({keep_updating:true})
class BlockTradesDepositRequest extends React.Component {
   static propTypes = {
      url:               React.PropTypes.string,
      gateway:           React.PropTypes.string,
      deposit_coin_type: React.PropTypes.string,
      deposit_asset_name: React.PropTypes.string,
      receive_coin_type: React.PropTypes.string,
      account: ChainTypes.ChainAccount,
      issuer_account: ChainTypes.ChainAccount,
      deposit_asset: React.PropTypes.string,
      receive_asset: ChainTypes.ChainAsset
   };

   constructor(props) {
      super(props);
      this.state = { receive_address: null };
   }

   requestDepositAddress() {
      let body = JSON.stringify({
                  inputCoinType:this.props.deposit_coin_type,
                  outputCoinType:this.props.receive_coin_type,
                  outputAddress:this.props.account.get('name')
              })
      console.log( "body: ", body );

      fetch( this.props.url + '/initiate-trade', {
              method:'post',
              headers: new Headers( { "Accept": "application/json", "Content-Type":"application/json" } ),
              body: body
           }).then( reply => { reply.json().then( json => {
               console.log( "reply: ", json )
               if( json.inputAddress )
                  this.addDepositAddress( json.inputAddress );
               else
                  this.addDepositAddress( "unknown" );
           }, error => {
               console.log( "error: ",error  );
               this.addDepositAddress( "unknown" );
           }
           )
           }, error => {
               console.log( "error: ",error  );
               this.addDepositAddress( "unknown" );
           }); 

   }

   addDepositAddress( receive_address ) {
      let wallet = WalletDb.getWallet();
      let name = this.props.account.get('name');
      console.log( "this.props.gateway: ", this.props.gateway );
      console.log( "this.props.deposit_asset: ", this.props.deposit_asset );

      if( !wallet.deposit_keys ) wallet.deposit_keys = {}
      if( !wallet.deposit_keys[this.props.gateway] ) 
         wallet.deposit_keys[this.props.gateway] = {}
      if( !wallet.deposit_keys[this.props.gateway][this.props.deposit_asset] ) 
         wallet.deposit_keys[this.props.gateway][this.props.deposit_asset] = {}
      if( !wallet.deposit_keys[this.props.gateway][this.props.deposit_asset][name] )
          wallet.deposit_keys[this.props.gateway][this.props.deposit_asset][name] = [receive_address]
      else
          wallet.deposit_keys[this.props.gateway][this.props.deposit_asset][name].push( receive_address );

      WalletDb._updateWallet();

      this.setState( {receive_address} );
   }

   getWithdrawModalId() {
      console.log( "this.props.issuer: ", this.props.issuer_account.toJS() )
      console.log( "this.receive_asset.issuer: ", this.props.receive_asset.toJS() )
       return "withdraw_asset_"+this.props.issuer_account.get('name') + "_"+this.props.receive_asset.get('symbol');
   }

   onWithdraw() {
       ZfApi.publish(this.getWithdrawModalId(), "open");
   }
 

   render() {
      if( !this.props.account || !this.props.issuer_account || !this.props.receive_asset )
         return <tr><td></td><td></td><td></td><td></td></tr>

      let wallet = WalletDb.getWallet();
      let receive_address = this.state.receive_address;
      if( !receive_address )  {
         if( wallet.deposit_keys && 
             wallet.deposit_keys[this.props.gateway] && 
             wallet.deposit_keys[this.props.gateway][this.props.deposit_asset] &&
             wallet.deposit_keys[this.props.gateway][this.props.deposit_asset][this.props.account.get('name')] 
             )
         {
            let addresses = wallet.deposit_keys[this.props.gateway][this.props.deposit_asset][this.props.account.get('name')]
            receive_address = addresses[addresses.length-1]
         }
      }
      if( !receive_address ) { this.requestDepositAddress(); }

       let account_balances = this.props.account.get("balances").toJS();
       console.log( "balances: ", account_balances );
       let asset_types = Object.keys(account_balances);

       let balance = "0 " + this.props.receive_asset.get('symbol');
       if (asset_types.length > 0) {
           let current_asset_id = this.props.receive_asset.get('id');
           if( current_asset_id )
              balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>)
       } 
       let withdraw_modal_id = this.getWithdrawModalId();

      return <tr>
                    <td>{this.props.deposit_asset} </td>
                    <td><code>{receive_address}</code> &nbsp; <button className={"button outline"} onClick={this.requestDepositAddress.bind(this)}><Translate content="" />Generate</button> </td>
                    <td> <AccountBalance account={this.props.account.get('name')} asset={this.props.receive_asset.get('symbol')} /> </td>
                    <td> <button className={"button outline"} onClick={this.onWithdraw.bind(this)}><Translate content="" /> Withdraw </button>
                          <Modal id={withdraw_modal_id} overlay={true}>
                              <Trigger close={withdraw_modal_id}>
                                  <a href="#" className="close-button">&times;</a>
                              </Trigger>
                              <br/>
                              <div className="grid-block vertical">
                                   <WithdrawModal 
                                                  account={this.props.account.get('name')}
                                                  issuer={this.props.issuer_account.get('name')} 
                                                  asset={this.props.receive_asset.get('symbol')}
                                                  receive_asset_name={this.props.deposit_asset_name}
                                                  receive_asset_symbol={this.props.deposit_asset}
                                                  modal_id={withdraw_modal_id} />
                              </div>
                          </Modal>
                    </td>
             </tr>
   }
}; // BlockTradesDepositRequest

@BindToChainState({keep_updating:true})
class AccountDepositWithdraw extends React.Component {

   static propTypes = {
       account: ChainTypes.ChainAccount.isRequired,
       gprops: ChainTypes.ChainObject.isRequired,
       dprops: ChainTypes.ChainObject.isRequired
   }
   static defaultProps = {
       gprops: "2.0.0",
       dprops: "2.1.0"
   }

   constructor( props ) {
      super(props);
   }

   render() {
      return (
      <div className="grid-block vertical">
          <h2>Gateways</h2>
          <hr/>


          <div className="grid-block vertical">
             <h3>Open Ledger (CCEDK)</h3>

               <div>
                   <table className="table">
                       <thead>
                       <tr>
                           <th>Symbol</th>
                           <th>Deposit To</th>
                           <th>Balance</th>
                           <th>Withdraw</th>
                       </tr>
                       </thead>
                       <tbody>
                       {
                         <BlockTradesDepositRequest 
                                gateway="openledger"
                                url="https://bitshares.openledger.info:443/depositwithdraw/api/v2/simple-api"
                                issuer_account="openledger-wallet"
                                account={this.props.account.get('name')} 
                                receive_asset="OPENBTC"
                                deposit_asset="BTC"
                                deposit_coin_type="btc"
                                deposit_asset_name="Bitcoin"
                                receive_coin_type="openbtc" />
                          
                          /*
                         <BlockTradesDepositRequest 
                                url="https://ccedk.com:443/api/v2/simple-api"
                                issuer_account="ccedk"
                                account={this.props.account.get('name')} 
                                receive_asset="CCEDK.BTC"
                                deposit_asset="BTC"
                                deposit_coin_type="btc"
                                receive_coin_type="ccedk.btc" />
                         <BlockTradesDepositRequest 
                                url="https://ccedk.com:443/api/v2/simple-api"
                                issuer_account="ccedk"
                                account={this.props.account.get('name')} 
                                deposit_coin_type="ltc"
                                deposit_asset="LTC"
                                receive_asset="CCEDK.LTC"
                                receive_coin_type="ccedk.ltc" />
                                */}
                       </tbody>
                   </table>
               </div>
          </div>
          <div className="grid-block vertical">
             <h3>BlockTrades.us</h3>

               <div>
                   <table className="table">
                       <thead>
                       <tr>
                           <th>Symbol</th>
                           <th>Deposit To</th>
                           <th>Balance</th>
                           <th>Withdraw</th>
                       </tr>
                       </thead>
                       <tbody>
                         <BlockTradesDepositRequest 
                                gateway="blocktrades"
                                url="https://blocktrades.us:443/api/v2/simple-api"
                                issuer_account="blocktrades"
                                account={this.props.account.get('name')} 
                                receive_asset="TRADE.BTC"
                                deposit_asset="BTC"
                                deposit_coin_type="btc"
                                deposit_asset_name="Bitcoin"
                                receive_coin_type="trade.btc" />
                         <BlockTradesDepositRequest 
                                gateway="blocktrades"
                                url="https://blocktrades.us:443/api/v2/simple-api"
                                issuer_account="blocktrades"
                                account={this.props.account.get('name')} 
                                deposit_coin_type="ltc"
                                deposit_asset_name="Litecoin"
                                deposit_asset="LTC"
                                receive_asset="TRADE.LTC"
                                receive_coin_type="trade.ltc" />
                       </tbody>
                   </table>
               </div>


          </div>
      </div>
      )
   }
};


export default AccountDepositWithdraw;
